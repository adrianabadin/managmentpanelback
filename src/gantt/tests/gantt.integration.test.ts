import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { GanttService } from "../gantt.service";
import type { CreateGanttItemInputType, CreateDependencyInputType } from "../gantt.schema";

/**
 * GANTT MODULE - INTEGRATION TESTS
 *
 * Estos tests usan una base de datos real de MongoDB para validar:
 * - Transacciones Prisma
 * - Algoritmo DFS para dependencias circulares
 * - Materialized Path para jerarquías
 * - Validaciones de integridad referencial
 *
 * IMPORTANTE: Estos tests requieren DATABASE_URL_TEST configurada
 */

const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_TEST || process.env.DATABASE_URL,
    },
  },
});

const ganttService = new GanttService(testPrisma);

// Test data IDs
let testUserId: string;
let testDepartmentId: string;
let testDemographyId: string;
let testGanttItemId: string;
let testChildItemId: string;
let testDependencyId: string;

describe("Gantt Integration Tests", () => {
  // ============================================================================
  // SETUP & TEARDOWN
  // ============================================================================

  beforeAll(async () => {
    // Conectar a la base de datos de prueba
    await testPrisma.$connect();

    // Crear datos de prueba: Usuario
    const user = await testPrisma.users.create({
      data: {
        username: `test-gantt-${Date.now()}@example.com`,
        name: "Test",
        lastname: "User",
        paswordHash: "hashedpassword123", // Nota: typo en schema (pasword en lugar de password)
        isAdmin: false,
      },
    });
    testUserId = user.id;

    // Crear datos de prueba: Departamento
    const department = await testPrisma.departments.create({
      data: {
        name: `Test Department ${Date.now()}`,
        description: "Integration test department",
      },
    });
    testDepartmentId = department.id;

    // Crear datos de prueba: Demografía
    const demography = await testPrisma.demography.create({
      data: {
        state: `TEST-${Date.now()}`,
        population: 100000,
        description: "Integration test demography",
        politics: "Test politics",
      },
    });
    testDemographyId = demography.id;
  });

  afterAll(async () => {
    // Limpiar datos de prueba en orden inverso (por FKs)
    if (testDependencyId) {
      await testPrisma.ganttDependency.deleteMany({
        where: { OR: [{ id: testDependencyId }] },
      });
    }

    // Delete in correct order to respect foreign key constraints
    if (testUserId) {
      // 1. Delete ALL dependencies for test items
      await testPrisma.ganttDependency.deleteMany({
        where: {
          OR: [
            { sourceItem: { createdById: testUserId } },
            { targetItem: { createdById: testUserId } },
          ],
        },
      });

      // 2. Break parent-child relationships (set parentId to null)
      await testPrisma.ganttItem.updateMany({
        where: { createdById: testUserId },
        data: { parentId: null },
      });

      // 3. Delete ALL gantt items created by test user
      await testPrisma.ganttItem.deleteMany({
        where: { createdById: testUserId },
      });
    }

    // 3. Delete user (referenced by gantt items)
    if (testUserId) {
      await testPrisma.users.delete({ where: { id: testUserId } });
    }

    // 4. Delete department (referenced by gantt items)
    if (testDepartmentId) {
      await testPrisma.departments.delete({ where: { id: testDepartmentId } });
    }

    // 5. Delete demography (referenced by gantt items)
    if (testDemographyId) {
      await testPrisma.demography.delete({ where: { id: testDemographyId } });
    }

    await testPrisma.$disconnect();
  });

  beforeEach(() => {
    // Reset IDs para cada test
    testGanttItemId = "";
    testChildItemId = "";
    testDependencyId = "";
  });

  // ============================================================================
  // GANTT ITEM CRUD - INTEGRATION TESTS
  // ============================================================================

  describe("createGanttItem - Integration", () => {
    it("should create a gantt item with all relations", async () => {
      const createData: CreateGanttItemType = {
        title: "Integration Test Task",
        description: "Testing full integration with real DB",
        startDate: new Date("2025-03-01"),
        endDate: new Date("2025-03-31"),
        progress: 0,
        priority: "high",
        status: "planning",
        type: "task",
        departmentsId: testDepartmentId,
        demographyId: testDemographyId,
        assignedToId: testUserId,
        createdById: testUserId,
        estimatedHours: 80,
        color: "#ff5733",
      };

      const result = await ganttService.createGanttItem(createData);

      expect(result).toBeDefined();
      expect(result).not.toBeInstanceOf(Error);
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("path");
      expect((result as any).title).toBe(createData.title);
      expect((result as any).path).toMatch(/^\/[a-f0-9-]+\/$/); // UUID en path

      testGanttItemId = (result as any).id;
    });

    it("should create a child item with correct materialized path", async () => {
      // Crear padre primero
      const parentData: CreateGanttItemType = {
        title: "Parent Task",
        startDate: new Date("2025-03-01"),
        endDate: new Date("2025-03-31"),
        createdById: testUserId,
      };

      const parent = await ganttService.createGanttItem(parentData);
      const parentId = (parent as any).id;
      const parentPath = (parent as any).path;

      // Crear hijo
      const childData: CreateGanttItemType = {
        title: "Child Task",
        startDate: new Date("2025-03-10"),
        endDate: new Date("2025-03-20"),
        createdById: testUserId,
        parentId: parentId,
      };

      const child = await ganttService.createGanttItem(childData);

      expect(child).toBeDefined();
      expect(child).not.toBeInstanceOf(Error);
      expect((child as any).parentId).toBe(parentId);
      expect((child as any).depth).toBe(1);
      expect((child as any).path).toBe(`${parentPath}${(child as any).id}/`);

      testGanttItemId = parentId;
      testChildItemId = (child as any).id;
    });

    it("should validate date range (startDate < endDate)", async () => {
      const invalidData: CreateGanttItemType = {
        title: "Invalid Date Range",
        startDate: new Date("2025-03-31"),
        endDate: new Date("2025-03-01"), // Antes del startDate
        createdById: testUserId,
      };

      const result = await ganttService.createGanttItem(invalidData);

      expect(result).toBeInstanceOf(Error);
      expect((result as any).code).toBe("GANTT02"); // InvalidDateRange
    });

    it("should validate milestone dates (same startDate and endDate)", async () => {
      const milestoneDate = new Date("2025-03-15");
      const milestoneData: CreateGanttItemType = {
        title: "Milestone",
        type: "milestone",
        startDate: milestoneDate,
        endDate: milestoneDate,
        createdById: testUserId,
      };

      const result = await ganttService.createGanttItem(milestoneData);

      expect(result).toBeDefined();
      expect(result).not.toBeInstanceOf(Error);
      expect((result as any).type).toBe("milestone");

      testGanttItemId = (result as any).id;
    });

    it("should reject milestone with different dates", async () => {
      const milestoneData: CreateGanttItemType = {
        title: "Invalid Milestone",
        type: "milestone",
        startDate: new Date("2025-03-15"),
        endDate: new Date("2025-03-20"), // Diferente
        createdById: testUserId,
      };

      const result = await ganttService.createGanttItem(milestoneData);

      expect(result).toBeInstanceOf(Error);
      expect((result as any).code).toBe("GANTT04"); // MilestoneInvalidDates
    });

    it("should reject summary with assignee", async () => {
      const summaryData: CreateGanttItemType = {
        title: "Invalid Summary",
        type: "summary",
        startDate: new Date("2025-03-01"),
        endDate: new Date("2025-03-31"),
        createdById: testUserId,
        assignedToId: testUserId, // Summaries no pueden tener assignee
      };

      const result = await ganttService.createGanttItem(summaryData);

      expect(result).toBeInstanceOf(Error);
      expect((result as any).code).toBe("GANTT05"); // SummaryCannotHaveAssignee
    });
  });

  describe("updateGanttItem - Integration", () => {
    it("should update gantt item fields", async () => {
      // Crear item
      const createData: CreateGanttItemType = {
        title: "Original Title",
        startDate: new Date("2025-03-01"),
        endDate: new Date("2025-03-31"),
        createdById: testUserId,
        progress: 0,
      };

      const created = await ganttService.createGanttItem(createData);
      testGanttItemId = (created as any).id;

      // Actualizar
      const updateData = {
        title: "Updated Title",
        progress: 50,
        status: "active" as const,
      };

      const updated = await ganttService.updateGanttItem(testGanttItemId, updateData);

      expect(updated).toBeDefined();
      expect(updated).not.toBeInstanceOf(Error);
      expect((updated as any).title).toBe("Updated Title");
      expect((updated as any).progress).toBe(50);
      expect((updated as any).status).toBe("active");
    });

    it("should prevent circular hierarchy (item as its own parent)", async () => {
      // Crear item
      const createData: CreateGanttItemType = {
        title: "Test Item",
        startDate: new Date("2025-03-01"),
        endDate: new Date("2025-03-31"),
        createdById: testUserId,
      };

      const created = await ganttService.createGanttItem(createData);
      const itemId = (created as any).id;
      testGanttItemId = itemId;

      // Intentar asignar como su propio padre
      const result = await ganttService.updateGanttItem(itemId, {
        parentId: itemId,
      });

      expect(result).toBeInstanceOf(Error);
      expect((result as any).code).toBe("GANTT07"); // CircularHierarchy
    });
  });

  describe("getGanttItem & listGanttItems - Integration", () => {
    it("should retrieve gantt item by id with relations", async () => {
      // Crear item
      const createData: CreateGanttItemType = {
        title: "Retrievable Task",
        startDate: new Date("2025-03-01"),
        endDate: new Date("2025-03-31"),
        createdById: testUserId,
        departmentsId: testDepartmentId,
        assignedToId: testUserId,
      };

      const created = await ganttService.createGanttItem(createData);
      testGanttItemId = (created as any).id;

      // Recuperar con relaciones
      const retrieved = await ganttService.getGanttItem(testGanttItemId, true);

      expect(retrieved).toBeDefined();
      expect(retrieved).not.toBeInstanceOf(Error);
      expect((retrieved as any).id).toBe(testGanttItemId);
      expect((retrieved as any).department).toBeDefined();
      expect((retrieved as any).assignedTo).toBeDefined();
      expect((retrieved as any).createdBy).toBeDefined();
    });

    it("should list gantt items with pagination", async () => {
      const result = await ganttService.listGanttItems({
        page: 1,
        limit: 10,
        createdById: testUserId,
      });

      expect(result).toBeDefined();
      expect(result).not.toBeInstanceOf(Error);
      expect((result as any).data).toBeInstanceOf(Array);
      expect((result as any).pagination).toBeDefined();
      expect((result as any).pagination.page).toBe(1);
      expect((result as any).pagination.limit).toBe(10);
    });
  });

  describe("deleteGanttItem - Integration", () => {
    it("should soft delete gantt item", async () => {
      // Crear item
      const createData: CreateGanttItemType = {
        title: "To Delete",
        startDate: new Date("2025-03-01"),
        endDate: new Date("2025-03-31"),
        createdById: testUserId,
      };

      const created = await ganttService.createGanttItem(createData);
      const itemId = (created as any).id;

      // Eliminar
      const deleted = await ganttService.deleteGanttItem(itemId);

      expect(deleted).toBeDefined();
      expect(deleted).not.toBeInstanceOf(Error);
      expect((deleted as any).message).toContain("eliminado");

      // Verificar soft delete
      const retrieved = await ganttService.getGanttItem(itemId);
      expect(retrieved).toBeInstanceOf(Error); // No debería encontrarse (isActive=false)
    });

    it("should prevent deletion of item with children", async () => {
      // Crear padre
      const parentData: CreateGanttItemType = {
        title: "Parent",
        startDate: new Date("2025-03-01"),
        endDate: new Date("2025-03-31"),
        createdById: testUserId,
      };

      const parent = await ganttService.createGanttItem(parentData);
      const parentId = (parent as any).id;
      testGanttItemId = parentId;

      // Crear hijo
      const childData: CreateGanttItemType = {
        title: "Child",
        startDate: new Date("2025-03-10"),
        endDate: new Date("2025-03-20"),
        createdById: testUserId,
        parentId: parentId,
      };

      const child = await ganttService.createGanttItem(childData);
      testChildItemId = (child as any).id;

      // Intentar eliminar padre
      const result = await ganttService.deleteGanttItem(parentId);

      expect(result).toBeInstanceOf(Error);
      expect((result as any).code).toBe("GANTT09"); // CannotDeleteItemWithChildren
    });
  });

  describe("completeGanttItem - Integration", () => {
    it("should mark item as completed", async () => {
      // Crear item
      const createData: CreateGanttItemType = {
        title: "To Complete",
        startDate: new Date("2025-03-01"),
        endDate: new Date("2025-03-31"),
        createdById: testUserId,
        progress: 50,
      };

      const created = await ganttService.createGanttItem(createData);
      testGanttItemId = (created as any).id;

      // Completar
      const completed = await ganttService.completeGanttItem(
        testGanttItemId,
        85,
        new Date("2025-03-25")
      );

      expect(completed).toBeDefined();
      expect(completed).not.toBeInstanceOf(Error);
      expect((completed as any).status).toBe("completed");
      expect((completed as any).progress).toBe(100);
      expect((completed as any).actualHours).toBe(85);
      expect((completed as any).completedAt).toBeDefined();
    });
  });

  // ============================================================================
  // GANTT DEPENDENCY - INTEGRATION TESTS
  // ============================================================================

  describe("createDependency - Integration", () => {
    it("should create dependency between two items", async () => {
      // Crear dos items
      const item1Data: CreateGanttItemType = {
        title: "Task 1",
        startDate: new Date("2025-03-01"),
        endDate: new Date("2025-03-15"),
        createdById: testUserId,
      };

      const item2Data: CreateGanttItemType = {
        title: "Task 2",
        startDate: new Date("2025-03-16"),
        endDate: new Date("2025-03-31"),
        createdById: testUserId,
      };

      const item1 = await ganttService.createGanttItem(item1Data);
      const item2 = await ganttService.createGanttItem(item2Data);

      const item1Id = (item1 as any).id;
      const item2Id = (item2 as any).id;
      testGanttItemId = item1Id;
      testChildItemId = item2Id;

      // Crear dependencia: item2 depende de item1
      const depData: CreateDependencyType = {
        sourceItemId: item1Id,
        targetItemId: item2Id,
        type: "endToStart",
        lagDays: 0,
      };

      const dependency = await ganttService.createDependency(depData);

      expect(dependency).toBeDefined();
      expect(dependency).not.toBeInstanceOf(Error);
      expect((dependency as any).sourceItemId).toBe(item1Id);
      expect((dependency as any).targetItemId).toBe(item2Id);
      expect((dependency as any).type).toBe("endToStart");

      testDependencyId = (dependency as any).id;
    });

    it("should detect circular dependencies using DFS", async () => {
      // Crear 3 items: A -> B -> C
      const itemA = await ganttService.createGanttItem({
        title: "Task A",
        startDate: new Date("2025-03-01"),
        endDate: new Date("2025-03-10"),
        createdById: testUserId,
      });

      const itemB = await ganttService.createGanttItem({
        title: "Task B",
        startDate: new Date("2025-03-11"),
        endDate: new Date("2025-03-20"),
        createdById: testUserId,
      });

      const itemC = await ganttService.createGanttItem({
        title: "Task C",
        startDate: new Date("2025-03-21"),
        endDate: new Date("2025-03-31"),
        createdById: testUserId,
      });

      const idA = (itemA as any).id;
      const idB = (itemB as any).id;
      const idC = (itemC as any).id;

      // Crear dependencias: A -> B, B -> C
      await ganttService.createDependency({
        sourceItemId: idA,
        targetItemId: idB,
        type: "endToStart",
      });

      const dep2 = await ganttService.createDependency({
        sourceItemId: idB,
        targetItemId: idC,
        type: "endToStart",
      });

      testDependencyId = (dep2 as any).id;

      // Intentar crear ciclo: C -> A (crearía A -> B -> C -> A)
      const circularDep = await ganttService.createDependency({
        sourceItemId: idC,
        targetItemId: idA,
        type: "endToStart",
      });

      expect(circularDep).toBeInstanceOf(Error);
      expect((circularDep as any).code).toBe("GANTT21"); // CircularDependency

      // Limpiar
      testGanttItemId = idA;
      testChildItemId = idB;
      await testPrisma.ganttItem.deleteMany({
        where: { id: { in: [idA, idB, idC] } },
      });
    });

    it("should prevent self-dependency", async () => {
      const item = await ganttService.createGanttItem({
        title: "Task",
        startDate: new Date("2025-03-01"),
        endDate: new Date("2025-03-31"),
        createdById: testUserId,
      });

      const itemId = (item as any).id;
      testGanttItemId = itemId;

      // Intentar crear dependencia consigo mismo
      const result = await ganttService.createDependency({
        sourceItemId: itemId,
        targetItemId: itemId,
        type: "endToStart",
      });

      expect(result).toBeInstanceOf(Error);
      expect((result as any).code).toBe("GANTT22"); // SelfDependency
    });
  });

  describe("getItemDependencies - Integration", () => {
    it("should retrieve predecessors and successors", async () => {
      // Crear 3 items: A -> B -> C
      const itemA = await ganttService.createGanttItem({
        title: "Task A",
        startDate: new Date("2025-03-01"),
        endDate: new Date("2025-03-10"),
        createdById: testUserId,
      });

      const itemB = await ganttService.createGanttItem({
        title: "Task B",
        startDate: new Date("2025-03-11"),
        endDate: new Date("2025-03-20"),
        createdById: testUserId,
      });

      const itemC = await ganttService.createGanttItem({
        title: "Task C",
        startDate: new Date("2025-03-21"),
        endDate: new Date("2025-03-31"),
        createdById: testUserId,
      });

      const idA = (itemA as any).id;
      const idB = (itemB as any).id;
      const idC = (itemC as any).id;

      // Crear dependencias
      await ganttService.createDependency({
        sourceItemId: idA,
        targetItemId: idB,
        type: "endToStart",
      });

      const dep2 = await ganttService.createDependency({
        sourceItemId: idB,
        targetItemId: idC,
        type: "endToStart",
      });

      testDependencyId = (dep2 as any).id;

      // Obtener dependencias de B (tiene predecesor A y sucesor C)
      const dependencies = await ganttService.getItemDependencies(idB, "both");

      expect(dependencies).toBeDefined();
      expect(dependencies).not.toBeInstanceOf(Error);
      expect((dependencies as any).predecessors).toBeInstanceOf(Array);
      expect((dependencies as any).successors).toBeInstanceOf(Array);
      expect((dependencies as any).predecessors.length).toBe(1);
      expect((dependencies as any).successors.length).toBe(1);

      // Limpiar
      testGanttItemId = idA;
      testChildItemId = idB;
      await testPrisma.ganttItem.deleteMany({
        where: { id: { in: [idA, idB, idC] } },
      });
    });
  });

  // ==========================================================================
  // SEARCH GANTT ITEMS - Integration
  // ==========================================================================

  describe("searchGanttItems - Integration", () => {
    it("should search items by text in title", async () => {
      // Crear items con títulos diferentes
      const item1 = await ganttService.createGanttItem({
        title: "Important Project Task",
        description: "Regular description",
        startDate: new Date("2025-04-01"),
        endDate: new Date("2025-04-10"),
        createdById: testUserId,
      });

      const item2 = await ganttService.createGanttItem({
        title: "Another Task",
        description: "This is an important note",
        startDate: new Date("2025-04-11"),
        endDate: new Date("2025-04-20"),
        createdById: testUserId,
      });

      const id1 = (item1 as any).id;
      const id2 = (item2 as any).id;

      // Buscar por "Important" (debería encontrar ambos)
      const results = await ganttService.searchGanttItems({
        query: "Important",
        page: 1,
        pageSize: 50,
      });

      expect(results).toBeDefined();
      expect(results).not.toBeInstanceOf(Error);
      expect((results as any).data).toBeInstanceOf(Array);
      expect((results as any).data.length).toBeGreaterThanOrEqual(2);

      // Limpiar
      testGanttItemId = id1;
      testChildItemId = id2;
      await testPrisma.ganttItem.deleteMany({
        where: { id: { in: [id1, id2] } },
      });
    });

    it("should filter by progress range", async () => {
      // Crear items con diferentes progresos
      const item1 = await ganttService.createGanttItem({
        title: "Low Progress Task",
        startDate: new Date("2025-04-01"),
        endDate: new Date("2025-04-10"),
        progress: 10,
        createdById: testUserId,
      });

      const item2 = await ganttService.createGanttItem({
        title: "Medium Progress Task",
        startDate: new Date("2025-04-11"),
        endDate: new Date("2025-04-20"),
        progress: 50,
        createdById: testUserId,
      });

      const item3 = await ganttService.createGanttItem({
        title: "High Progress Task",
        startDate: new Date("2025-04-21"),
        endDate: new Date("2025-04-30"),
        progress: 90,
        createdById: testUserId,
      });

      const id1 = (item1 as any).id;
      const id2 = (item2 as any).id;
      const id3 = (item3 as any).id;

      // Buscar items con progreso entre 40 y 100
      const results = await ganttService.searchGanttItems({
        minProgress: 40,
        maxProgress: 100,
        page: 1,
        pageSize: 50,
      });

      expect(results).toBeDefined();
      expect(results).not.toBeInstanceOf(Error);
      expect((results as any).data).toBeInstanceOf(Array);
      // Debería encontrar al menos los 2 items con progreso >= 40
      const foundIds = (results as any).data.map((item: any) => item.id);
      expect(foundIds).toContain(id2);
      expect(foundIds).toContain(id3);

      // Limpiar
      testGanttItemId = id1;
      await testPrisma.ganttItem.deleteMany({
        where: { id: { in: [id1, id2, id3] } },
      });
    });

    it("should combine text search with type filter", async () => {
      // Crear milestone y task con texto similar
      const milestone = await ganttService.createGanttItem({
        title: "Milestone Delivery",
        startDate: new Date("2025-04-15"),
        endDate: new Date("2025-04-15"),
        type: "milestone",
        createdById: testUserId,
      });

      const task = await ganttService.createGanttItem({
        title: "Task Delivery",
        startDate: new Date("2025-04-16"),
        endDate: new Date("2025-04-20"),
        type: "task",
        createdById: testUserId,
      });

      const milestoneId = (milestone as any).id;
      const taskId = (task as any).id;

      // Buscar "Delivery" solo en tasks
      const results = await ganttService.searchGanttItems({
        query: "Delivery",
        type: "task",
        page: 1,
        pageSize: 50,
      });

      expect(results).toBeDefined();
      expect(results).not.toBeInstanceOf(Error);
      const foundIds = (results as any).data.map((item: any) => item.id);
      expect(foundIds).toContain(taskId);

      // Limpiar
      testGanttItemId = milestoneId;
      testChildItemId = taskId;
      await testPrisma.ganttItem.deleteMany({
        where: { id: { in: [milestoneId, taskId] } },
      });
    });
  });

  // ==========================================================================
  // BULK UPDATE GANTT ITEMS - Integration
  // ==========================================================================

  describe("bulkUpdateGanttItems - Integration", () => {
    it("should update multiple items at once", async () => {
      // Crear 3 items
      const item1 = await ganttService.createGanttItem({
        title: "Task 1",
        startDate: new Date("2025-05-01"),
        endDate: new Date("2025-05-10"),
        progress: 0,
        status: "planning",
        createdById: testUserId,
      });

      const item2 = await ganttService.createGanttItem({
        title: "Task 2",
        startDate: new Date("2025-05-11"),
        endDate: new Date("2025-05-20"),
        progress: 0,
        status: "planning",
        createdById: testUserId,
      });

      const item3 = await ganttService.createGanttItem({
        title: "Task 3",
        startDate: new Date("2025-05-21"),
        endDate: new Date("2025-05-31"),
        progress: 0,
        status: "planning",
        createdById: testUserId,
      });

      const id1 = (item1 as any).id;
      const id2 = (item2 as any).id;
      const id3 = (item3 as any).id;

      // Actualizar los 3 items a la vez
      const result = await ganttService.bulkUpdateGanttItems({
        ids: [id1, id2, id3],
        data: {
          progress: 50,
          status: "active",
        },
      });

      expect(result).toBeDefined();
      expect(result).not.toBeInstanceOf(Error);
      expect((result as any).count).toBe(3);
      expect((result as any).message).toContain("3 items actualizados");

      // Verificar que se actualizaron
      const updated1 = await testPrisma.ganttItem.findUnique({ where: { id: id1 } });
      const updated2 = await testPrisma.ganttItem.findUnique({ where: { id: id2 } });
      const updated3 = await testPrisma.ganttItem.findUnique({ where: { id: id3 } });

      expect(updated1?.progress).toBe(50);
      expect(updated1?.status).toBe("active");
      expect(updated2?.progress).toBe(50);
      expect(updated2?.status).toBe("active");
      expect(updated3?.progress).toBe(50);
      expect(updated3?.status).toBe("active");

      // Limpiar
      testGanttItemId = id1;
      await testPrisma.ganttItem.deleteMany({
        where: { id: { in: [id1, id2, id3] } },
      });
    });

    it("should fail if trying to update non-existent items", async () => {
      const result = await ganttService.bulkUpdateGanttItems({
        ids: ["fake-id-1", "fake-id-2"],
        data: { progress: 100 },
      });

      expect(result).toBeInstanceOf(Error);
    });
  });

  // ==========================================================================
  // BULK DELETE GANTT ITEMS - Integration
  // ==========================================================================

  describe("bulkDeleteGanttItems - Integration", () => {
    it("should soft delete multiple items at once", async () => {
      // Crear 3 items sin hijos
      const item1 = await ganttService.createGanttItem({
        title: "Delete Task 1",
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-06-10"),
        createdById: testUserId,
      });

      const item2 = await ganttService.createGanttItem({
        title: "Delete Task 2",
        startDate: new Date("2025-06-11"),
        endDate: new Date("2025-06-20"),
        createdById: testUserId,
      });

      const item3 = await ganttService.createGanttItem({
        title: "Delete Task 3",
        startDate: new Date("2025-06-21"),
        endDate: new Date("2025-06-30"),
        createdById: testUserId,
      });

      const id1 = (item1 as any).id;
      const id2 = (item2 as any).id;
      const id3 = (item3 as any).id;

      // Eliminar los 3 items a la vez
      const result = await ganttService.bulkDeleteGanttItems({
        ids: [id1, id2, id3],
      });

      expect(result).toBeDefined();
      expect(result).not.toBeInstanceOf(Error);
      expect((result as any).count).toBe(3);
      expect((result as any).message).toContain("3 items eliminados");

      // Verificar que se marcaron como inactivos (soft delete)
      const deleted1 = await testPrisma.ganttItem.findUnique({ where: { id: id1 } });
      const deleted2 = await testPrisma.ganttItem.findUnique({ where: { id: id2 } });
      const deleted3 = await testPrisma.ganttItem.findUnique({ where: { id: id3 } });

      expect(deleted1?.isActive).toBe(false);
      expect(deleted2?.isActive).toBe(false);
      expect(deleted3?.isActive).toBe(false);

      // Limpiar (físicamente ahora que están inactivos)
      testGanttItemId = id1;
      await testPrisma.ganttItem.deleteMany({
        where: { id: { in: [id1, id2, id3] } },
      });
    });

    it("should fail if items have active children", async () => {
      // Crear parent e hijo
      const parent = await ganttService.createGanttItem({
        title: "Parent Task",
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-06-30"),
        createdById: testUserId,
      });

      const parentId = (parent as any).id;

      const child = await ganttService.createGanttItem({
        title: "Child Task",
        startDate: new Date("2025-06-01"),
        endDate: new Date("2025-06-15"),
        parentId: parentId,
        createdById: testUserId,
      });

      const childId = (child as any).id;

      // Intentar eliminar parent (debería fallar porque tiene hijo activo)
      const result = await ganttService.bulkDeleteGanttItems({
        ids: [parentId],
      });

      expect(result).toBeInstanceOf(Error);

      // Limpiar
      testGanttItemId = parentId;
      testChildItemId = childId;
      await testPrisma.ganttItem.updateMany({
        where: { id: childId },
        data: { parentId: null },
      });
      await testPrisma.ganttItem.deleteMany({
        where: { id: { in: [parentId, childId] } },
      });
    });
  });
});
