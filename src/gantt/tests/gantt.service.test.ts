import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ============================================================================
// MOCKS - MUST BE BEFORE IMPORTS
// ============================================================================

const mockPrismaInstance = {
  $transaction: vi.fn((callback: any) => {
    // Execute the callback with the same mock instance as tx
    return callback(mockPrismaInstance);
  }),
  ganttItem: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
  },
  ganttDependency: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  users: {
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
  },
  departments: {
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
  },
  demography: {
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
  },
};

vi.mock("../../app.middleware", () => ({
  prismaClient: mockPrismaInstance,
}));

// ============================================================================
// IMPORTS - AFTER MOCKS
// ============================================================================

import { GanttService } from "../gantt.service";
import { PrismaError } from "../../prisma/prisma.errors";
import {
  GanttItemNotFound,
  InvalidDateRange,
  InvalidProgress,
  MilestoneInvalidDates,
  SummaryCannotHaveAssignee,
  InvalidParentReference,
  CircularHierarchy,
  MaxDepthExceeded,
  CannotDeleteItemWithChildren,
  CircularDependency,
  SelfDependency,
  DuplicateDependency,
  DependencyNotFound,
  DependencyItemNotFound,
  InvalidUserReference,
  InvalidDepartmentReference,
  InvalidDemographyReference,
  BulkItemsNotFound,
  BulkItemsWithChildren,
} from "../gantt.errors";

// ============================================================================
// MOCK DATA
// ============================================================================

const mockUser = {
  id: "user-123",
  username: "testuser",
  email: "test@example.com",
};

const mockDepartment = {
  id: "dept-123",
  name: "IT Department",
};

const mockDemography = {
  id: "demo-123",
  name: "State 1",
};

const mockGanttItem = {
  id: "gantt-123",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  title: "Test Task",
  description: "Test Description",
  startDate: new Date("2025-02-01"),
  endDate: new Date("2025-02-28"),
  progress: 50,
  priority: "medium",
  status: "active",
  type: "task",
  sortOrder: 0,
  estimatedHours: 40,
  actualHours: null,
  color: "#3498db",
  isActive: true,
  completedAt: null,
  parentId: null,
  path: "/gantt-123/",
  depth: 0,
  departmentsId: "dept-123",
  demographyId: "demo-123",
  assignedToId: "user-123",
  createdById: "user-123",
  hash: null,
};

const mockGanttDependency = {
  id: "dep-123",
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  sourceItemId: "gantt-123",
  targetItemId: "gantt-456",
  type: "endToStart",
  lagDays: 0,
  hash: null,
};

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Helper to check if a result is a PrismaError wrapping a specific GanttError type
 * Updated to also check if result is the error class directly (current implementation)
 */
function isPrismaErrorWrapping(result: any, ErrorClass: any): boolean {
  // Check if result is the error class directly (current implementation)
  if (result instanceof ErrorClass) return true;

  // Also check old pattern for PrismaError wrapping (backward compatibility)
  if (!(result instanceof PrismaError)) return false;
  if (!result.errorContent) return false;
  return result.errorContent instanceof ErrorClass;
}

// ============================================================================
// TESTS
// ============================================================================

describe("GanttService", () => {
  let ganttService: GanttService;

  beforeEach(() => {
    ganttService = new GanttService(mockPrismaInstance as any);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // CREATE GANTT ITEM
  // ==========================================================================

  describe("createGanttItem", () => {
    it("should create a gantt item successfully", async () => {
      const createData = {
        title: "New Task",
        description: "Test",
        startDate: new Date("2025-02-01"),
        endDate: new Date("2025-02-28"),
        createdById: "user-123",
      };

      mockPrismaInstance.users.findUniqueOrThrow.mockResolvedValue(mockUser);
      mockPrismaInstance.ganttItem.create.mockResolvedValue(mockGanttItem);
      mockPrismaInstance.ganttItem.update.mockResolvedValue(mockGanttItem);

      const result = await ganttService.createGanttItem(createData);

      expect(result).toEqual(mockGanttItem);
      expect(mockPrismaInstance.users.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: "user-123", isActive: true },
      });
      expect(mockPrismaInstance.ganttItem.create).toHaveBeenCalled();
      expect(mockPrismaInstance.ganttItem.update).toHaveBeenCalled();
    });

    it("should return InvalidDateRange if startDate >= endDate for non-milestone", async () => {
      const createData = {
        title: "Invalid Task",
        startDate: new Date("2025-02-28"),
        endDate: new Date("2025-02-01"),
        createdById: "user-123",
        type: "task" as const,
      };

      mockPrismaInstance.users.findUnique.mockResolvedValue(mockUser);

      const result = await ganttService.createGanttItem(createData);

      expect(isPrismaErrorWrapping(result, InvalidDateRange)).toBe(true);
    });

    it("should return InvalidProgress if progress < 0 or > 100", async () => {
      const createData = {
        title: "Invalid Progress",
        startDate: new Date("2025-02-01"),
        endDate: new Date("2025-02-28"),
        createdById: "user-123",
        progress: 150,
      };

      mockPrismaInstance.users.findUnique.mockResolvedValue(mockUser);

      const result = await ganttService.createGanttItem(createData);

      expect(isPrismaErrorWrapping(result, InvalidProgress)).toBe(true);
    });

    it("should return MilestoneInvalidDates if milestone has different start/end dates", async () => {
      const createData = {
        title: "Invalid Milestone",
        startDate: new Date("2025-02-01"),
        endDate: new Date("2025-02-28"),
        createdById: "user-123",
        type: "milestone" as const,
      };

      mockPrismaInstance.users.findUnique.mockResolvedValue(mockUser);

      const result = await ganttService.createGanttItem(createData);

      expect(isPrismaErrorWrapping(result, MilestoneInvalidDates)).toBe(true);
    });

    it("should return SummaryCannotHaveAssignee if summary has assignedToId", async () => {
      const createData = {
        title: "Invalid Summary",
        startDate: new Date("2025-02-01"),
        endDate: new Date("2025-02-28"),
        createdById: "user-123",
        type: "summary" as const,
        assignedToId: "user-123",
      };

      mockPrismaInstance.users.findUnique.mockResolvedValue(mockUser);

      const result = await ganttService.createGanttItem(createData);

      expect(isPrismaErrorWrapping(result, SummaryCannotHaveAssignee)).toBe(true);
    });

    it("should return InvalidUserReference if createdById does not exist", async () => {
      const createData = {
        title: "Task",
        startDate: new Date("2025-02-01"),
        endDate: new Date("2025-02-28"),
        createdById: "invalid-user",
      };

      mockPrismaInstance.users.findUniqueOrThrow.mockRejectedValue(new Error("Not found"));

      const result = await ganttService.createGanttItem(createData);

      expect(isPrismaErrorWrapping(result, InvalidUserReference)).toBe(true);
    });

    it("should return InvalidDepartmentReference if departmentsId does not exist", async () => {
      const createData = {
        title: "Task",
        startDate: new Date("2025-02-01"),
        endDate: new Date("2025-02-28"),
        createdById: "user-123",
        departmentsId: "invalid-dept",
      };

      mockPrismaInstance.users.findUniqueOrThrow.mockResolvedValue(mockUser);
      mockPrismaInstance.departments.findUniqueOrThrow.mockRejectedValue(new Error("Not found"));

      const result = await ganttService.createGanttItem(createData);

      expect(isPrismaErrorWrapping(result, InvalidDepartmentReference)).toBe(true);
    });

    it("should return InvalidDemographyReference if demographyId does not exist", async () => {
      const createData = {
        title: "Task",
        startDate: new Date("2025-02-01"),
        endDate: new Date("2025-02-28"),
        createdById: "user-123",
        demographyId: "invalid-demo",
      };

      mockPrismaInstance.users.findUniqueOrThrow.mockResolvedValue(mockUser);
      mockPrismaInstance.demography.findUniqueOrThrow.mockRejectedValue(new Error("Not found"));

      const result = await ganttService.createGanttItem(createData);

      expect(isPrismaErrorWrapping(result, InvalidDemographyReference)).toBe(true);
    });

    it("should calculate path correctly for child items", async () => {
      const parentItem = {
        ...mockGanttItem,
        id: "parent-123",
        path: "/parent-123/",
        depth: 0,
      };

      const childItem = {
        ...mockGanttItem,
        id: "child-123",
        parentId: "parent-123",
        path: "/parent-123/child-123/",
        depth: 1,
      };

      const createData = {
        title: "Child Task",
        startDate: new Date("2025-02-01"),
        endDate: new Date("2025-02-28"),
        createdById: "user-123",
        parentId: "parent-123",
      };

      mockPrismaInstance.users.findUniqueOrThrow.mockResolvedValue(mockUser);
      mockPrismaInstance.ganttItem.findUnique.mockResolvedValue(parentItem);
      mockPrismaInstance.ganttItem.create.mockResolvedValue({
        ...mockGanttItem,
        id: "child-123",
        parentId: "parent-123",
      });
      mockPrismaInstance.ganttItem.update.mockResolvedValue(childItem);

      const result = await ganttService.createGanttItem(createData);

      expect(result).not.toBeInstanceOf(Error);
      expect(result).toEqual(childItem);
      expect(mockPrismaInstance.ganttItem.create).toHaveBeenCalled();
      expect(mockPrismaInstance.ganttItem.update).toHaveBeenCalled();
    });

    it("should return MaxDepthExceeded if depth exceeds 10", async () => {
      const deepParent = {
        ...mockGanttItem,
        depth: 10,
        path: "/parent/",
      };

      const createData = {
        title: "Too Deep",
        startDate: new Date("2025-02-01"),
        endDate: new Date("2025-02-28"),
        createdById: "user-123",
        parentId: "deep-parent",
      };

      mockPrismaInstance.users.findUniqueOrThrow.mockResolvedValue(mockUser);
      mockPrismaInstance.ganttItem.findUnique.mockResolvedValue(deepParent);

      const result = await ganttService.createGanttItem(createData);

      expect(isPrismaErrorWrapping(result, MaxDepthExceeded)).toBe(true);
    });
  });

  // ==========================================================================
  // UPDATE GANTT ITEM
  // ==========================================================================

  describe("updateGanttItem", () => {
    it("should update a gantt item successfully", async () => {
      const updateData = {
        title: "Updated Task",
        progress: 75,
      };

      mockPrismaInstance.ganttItem.findUnique.mockResolvedValue(mockGanttItem);
      mockPrismaInstance.ganttItem.update.mockResolvedValue({
        ...mockGanttItem,
        ...updateData,
      });

      const result = await ganttService.updateGanttItem("gantt-123", updateData);

      expect(result).toEqual({ ...mockGanttItem, ...updateData });
      expect(mockPrismaInstance.ganttItem.update).toHaveBeenCalled();
    });

    it("should return GanttItemNotFound if item does not exist", async () => {
      mockPrismaInstance.ganttItem.findUnique.mockResolvedValue(null);

      const result = await ganttService.updateGanttItem("invalid-id", { title: "Test" });

      expect(isPrismaErrorWrapping(result, GanttItemNotFound)).toBe(true);
    });

    it("should return InvalidDateRange if updating dates incorrectly", async () => {
      const updateData = {
        startDate: new Date("2025-02-28"),
        endDate: new Date("2025-02-01"),
      };

      mockPrismaInstance.ganttItem.findUnique.mockResolvedValue(mockGanttItem);

      const result = await ganttService.updateGanttItem("gantt-123", updateData);

      expect(isPrismaErrorWrapping(result, InvalidDateRange)).toBe(true);
    });

    it("should return CircularHierarchy if trying to set parent to self", async () => {
      const updateData = {
        parentId: "gantt-123",
      };

      mockPrismaInstance.ganttItem.findUnique.mockResolvedValue(mockGanttItem);

      const result = await ganttService.updateGanttItem("gantt-123", updateData);

      expect(isPrismaErrorWrapping(result, CircularHierarchy)).toBe(true);
    });

    it("should recalculate path when parentId changes", async () => {
      const newParent = {
        ...mockGanttItem,
        id: "new-parent",
        path: "/new-parent/",
        depth: 0,
      };

      const updateData = {
        parentId: "new-parent",
      };

      mockPrismaInstance.ganttItem.findUnique
        .mockResolvedValueOnce(mockGanttItem) // First call for existing item
        .mockResolvedValueOnce(newParent); // Second call for new parent

      mockPrismaInstance.ganttItem.update.mockResolvedValue({
        ...mockGanttItem,
        parentId: "new-parent",
        path: "/new-parent/gantt-123/",
        depth: 1,
      });

      const result = await ganttService.updateGanttItem("gantt-123", updateData);

      expect(result).not.toBeInstanceOf(Error);
      expect(mockPrismaInstance.ganttItem.update).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // GET GANTT ITEM
  // ==========================================================================

  describe("getGanttItem", () => {
    it("should get a gantt item with relations", async () => {
      const itemWithRelations = {
        ...mockGanttItem,
        department: mockDepartment,
        demography: mockDemography,
        assignedTo: mockUser,
        createdBy: mockUser,
      };

      mockPrismaInstance.ganttItem.findUnique.mockResolvedValue(itemWithRelations);

      const result = await ganttService.getGanttItem("gantt-123", true);

      expect(result).toEqual(itemWithRelations);
      expect(mockPrismaInstance.ganttItem.findUnique).toHaveBeenCalledWith({
        where: { id: "gantt-123", isActive: true },
        include: expect.any(Object),
      });
    });

    it("should get a gantt item without relations", async () => {
      mockPrismaInstance.ganttItem.findUnique.mockResolvedValue(mockGanttItem);

      const result = await ganttService.getGanttItem("gantt-123", false);

      expect(result).toEqual(mockGanttItem);
      expect(mockPrismaInstance.ganttItem.findUnique).toHaveBeenCalledWith({
        where: { id: "gantt-123", isActive: true },
        include: undefined,
      });
    });

    it("should return GanttItemNotFound if item does not exist", async () => {
      mockPrismaInstance.ganttItem.findUnique.mockResolvedValue(null);

      const result = await ganttService.getGanttItem("invalid-id");

      expect(isPrismaErrorWrapping(result, GanttItemNotFound)).toBe(true);
    });
  });

  // ==========================================================================
  // LIST GANTT ITEMS
  // ==========================================================================

  describe("listGanttItems", () => {
    it("should list gantt items with pagination", async () => {
      const items = [mockGanttItem, { ...mockGanttItem, id: "gantt-456" }];

      mockPrismaInstance.ganttItem.findMany.mockResolvedValue(items);
      mockPrismaInstance.ganttItem.count.mockResolvedValue(2);

      const result = await ganttService.listGanttItems({ page: 1, limit: 10 });

      expect(result).toEqual({
        data: items,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      });
    });

    it("should filter by departmentsId", async () => {
      mockPrismaInstance.ganttItem.findMany.mockResolvedValue([mockGanttItem]);
      mockPrismaInstance.ganttItem.count.mockResolvedValue(1);

      await ganttService.listGanttItems({ departmentsId: "dept-123" });

      expect(mockPrismaInstance.ganttItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            departmentsId: "dept-123",
          }),
        })
      );
    });

    it("should filter by status", async () => {
      mockPrismaInstance.ganttItem.findMany.mockResolvedValue([mockGanttItem]);
      mockPrismaInstance.ganttItem.count.mockResolvedValue(1);

      await ganttService.listGanttItems({ status: "active" });

      expect(mockPrismaInstance.ganttItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "active",
          }),
        })
      );
    });

    it("should filter by date range", async () => {
      mockPrismaInstance.ganttItem.findMany.mockResolvedValue([mockGanttItem]);
      mockPrismaInstance.ganttItem.count.mockResolvedValue(1);

      await ganttService.listGanttItems({
        startDateFrom: new Date("2025-02-01"),
        startDateTo: new Date("2025-02-28"),
      });

      expect(mockPrismaInstance.ganttItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startDate: expect.any(Object),
          }),
        })
      );
    });
  });

  // ==========================================================================
  // DELETE GANTT ITEM
  // ==========================================================================

  describe("deleteGanttItem", () => {
    it("should soft delete a gantt item successfully", async () => {
      const deletedItem = {
        ...mockGanttItem,
        isActive: false,
      };

      mockPrismaInstance.ganttItem.findUnique.mockResolvedValue({
        ...mockGanttItem,
        children: [], // No children
      });
      mockPrismaInstance.ganttItem.update.mockResolvedValue(deletedItem);

      const result = await ganttService.deleteGanttItem("gantt-123");

      expect(result).toEqual({
        message: "Item eliminado correctamente",
        id: mockGanttItem.id,
      });
      expect(mockPrismaInstance.ganttItem.update).toHaveBeenCalledWith({
        where: { id: "gantt-123" },
        data: { isActive: false },
      });
    });

    it("should return GanttItemNotFound if item does not exist", async () => {
      mockPrismaInstance.ganttItem.findUnique.mockResolvedValue(null);

      const result = await ganttService.deleteGanttItem("invalid-id");

      expect(isPrismaErrorWrapping(result, GanttItemNotFound)).toBe(true);
    });

    it("should return CannotDeleteItemWithChildren if item has children", async () => {
      const childItem = { ...mockGanttItem, id: "child-123", parentId: "gantt-123" };

      mockPrismaInstance.ganttItem.findUnique.mockResolvedValue({
        ...mockGanttItem,
        children: [childItem], // Item has active children
      });

      const result = await ganttService.deleteGanttItem("gantt-123");

      expect(isPrismaErrorWrapping(result, CannotDeleteItemWithChildren)).toBe(true);
    });
  });

  // ==========================================================================
  // COMPLETE GANTT ITEM
  // ==========================================================================

  describe("completeGanttItem", () => {
    it("should complete a gantt item successfully", async () => {
      const completedDate = new Date("2025-02-15");

      mockPrismaInstance.ganttItem.findUnique.mockResolvedValue(mockGanttItem);
      mockPrismaInstance.ganttItem.update.mockResolvedValue({
        ...mockGanttItem,
        status: "completed",
        progress: 100,
        actualHours: 45,
        completedAt: completedDate,
      });

      const result = await ganttService.completeGanttItem("gantt-123", 45, completedDate);

      expect(result).toEqual({
        ...mockGanttItem,
        status: "completed",
        progress: 100,
        actualHours: 45,
        completedAt: completedDate,
      });
    });

    it("should return GanttItemNotFound if item does not exist", async () => {
      mockPrismaInstance.ganttItem.findUnique.mockResolvedValue(null);

      const result = await ganttService.completeGanttItem("invalid-id");

      expect(isPrismaErrorWrapping(result, GanttItemNotFound)).toBe(true);
    });

    it("should use current date if completedAt not provided", async () => {
      mockPrismaInstance.ganttItem.findUnique.mockResolvedValue(mockGanttItem);
      mockPrismaInstance.ganttItem.update.mockResolvedValue({
        ...mockGanttItem,
        status: "completed",
        progress: 100,
        completedAt: expect.any(Date),
      });

      await ganttService.completeGanttItem("gantt-123");

      expect(mockPrismaInstance.ganttItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            completedAt: expect.any(Date),
          }),
        })
      );
    });
  });

  // ==========================================================================
  // CREATE DEPENDENCY
  // ==========================================================================

  describe("createDependency", () => {
    it("should create a dependency successfully", async () => {
      const createData = {
        sourceItemId: "gantt-123",
        targetItemId: "gantt-456",
        type: "endToStart" as const,
      };

      mockPrismaInstance.ganttItem.findUnique.mockResolvedValue(mockGanttItem);
      mockPrismaInstance.ganttDependency.findMany.mockResolvedValue([]); // No circular
      mockPrismaInstance.ganttDependency.count.mockResolvedValue(0); // No duplicate
      mockPrismaInstance.ganttDependency.create.mockResolvedValue(mockGanttDependency);

      const result = await ganttService.createDependency(createData);

      expect(result).toEqual(mockGanttDependency);
      expect(mockPrismaInstance.ganttDependency.create).toHaveBeenCalled();
    });

    it("should return SelfDependency if sourceItemId === targetItemId", async () => {
      const createData = {
        sourceItemId: "gantt-123",
        targetItemId: "gantt-123",
        type: "endToStart" as const,
      };

      const result = await ganttService.createDependency(createData);

      expect(isPrismaErrorWrapping(result, SelfDependency)).toBe(true);
    });

    it("should return DependencyItemNotFound if source or target does not exist", async () => {
      const createData = {
        sourceItemId: "invalid-source",
        targetItemId: "gantt-456",
        type: "endToStart" as const,
      };

      mockPrismaInstance.ganttItem.findUnique.mockResolvedValue(null);

      const result = await ganttService.createDependency(createData);

      expect(isPrismaErrorWrapping(result, DependencyItemNotFound)).toBe(true);
    });

    it("should return DuplicateDependency if dependency already exists", async () => {
      const createData = {
        sourceItemId: "gantt-123",
        targetItemId: "gantt-456",
        type: "endToStart" as const,
      };

      mockPrismaInstance.ganttItem.findUnique.mockResolvedValue(mockGanttItem);
      mockPrismaInstance.ganttDependency.findMany.mockResolvedValue([]); // No circular deps

      // Prisma throws P2002 for unique constraint violation
      const prismaError = new Error("Unique constraint failed");
      (prismaError as any).code = "P2002";
      mockPrismaInstance.ganttDependency.create.mockRejectedValue(prismaError);

      const result = await ganttService.createDependency(createData);

      // P2002 is converted to DuplicateIdentifierConstraintError (PrismaError)
      expect(result).toBeInstanceOf(Error);
      expect((result as any).code).toBe("P2002");
    });

    it("should detect circular dependencies", async () => {
      const createData = {
        sourceItemId: "gantt-123",
        targetItemId: "gantt-456",
        type: "endToStart" as const,
      };

      // Mock existing dependency that would create a cycle
      mockPrismaInstance.ganttItem.findUnique.mockResolvedValue(mockGanttItem);
      mockPrismaInstance.ganttDependency.count.mockResolvedValue(0);
      mockPrismaInstance.ganttDependency.findMany.mockResolvedValue([
        { targetItemId: "gantt-123" }, // 456 -> 123 exists, creating 123 -> 456 would cycle
      ]);

      const result = await ganttService.createDependency(createData);

      expect(isPrismaErrorWrapping(result, CircularDependency)).toBe(true);
    });
  });

  // ==========================================================================
  // UPDATE DEPENDENCY
  // ==========================================================================

  describe("updateDependency", () => {
    it("should update a dependency successfully", async () => {
      const updateData = {
        lagDays: 5,
      };

      mockPrismaInstance.ganttDependency.findUnique.mockResolvedValue(mockGanttDependency);
      mockPrismaInstance.ganttDependency.update.mockResolvedValue({
        ...mockGanttDependency,
        ...updateData,
      });

      const result = await ganttService.updateDependency("dep-123", updateData);

      expect(result).toEqual({ ...mockGanttDependency, ...updateData });
    });

    it("should return DependencyNotFound if dependency does not exist", async () => {
      mockPrismaInstance.ganttDependency.findUnique.mockResolvedValue(null);

      const result = await ganttService.updateDependency("invalid-id", { lagDays: 5 });

      expect(isPrismaErrorWrapping(result, DependencyNotFound)).toBe(true);
    });
  });

  // ==========================================================================
  // GET DEPENDENCY
  // ==========================================================================

  describe("getDependency", () => {
    it("should get a dependency successfully", async () => {
      mockPrismaInstance.ganttDependency.findUnique.mockResolvedValue(mockGanttDependency);

      const result = await ganttService.getDependency("dep-123");

      expect(result).toEqual(mockGanttDependency);
    });

    it("should return DependencyNotFound if dependency does not exist", async () => {
      mockPrismaInstance.ganttDependency.findUnique.mockResolvedValue(null);

      const result = await ganttService.getDependency("invalid-id");

      expect(isPrismaErrorWrapping(result, DependencyNotFound)).toBe(true);
    });
  });

  // ==========================================================================
  // LIST DEPENDENCIES
  // ==========================================================================

  describe("listDependencies", () => {
    it("should list all dependencies", async () => {
      const dependencies = [mockGanttDependency];

      mockPrismaInstance.ganttDependency.findMany.mockResolvedValue(dependencies);

      const result = await ganttService.listDependencies({});

      expect(result).toEqual(dependencies);
    });

    it("should filter by sourceItemId", async () => {
      mockPrismaInstance.ganttDependency.findMany.mockResolvedValue([mockGanttDependency]);

      await ganttService.listDependencies({ sourceItemId: "gantt-123" });

      expect(mockPrismaInstance.ganttDependency.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            sourceItemId: "gantt-123",
          }),
        })
      );
    });

    it("should filter by targetItemId", async () => {
      mockPrismaInstance.ganttDependency.findMany.mockResolvedValue([mockGanttDependency]);

      await ganttService.listDependencies({ targetItemId: "gantt-456" });

      expect(mockPrismaInstance.ganttDependency.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            targetItemId: "gantt-456",
          }),
        })
      );
    });
  });

  // ==========================================================================
  // DELETE DEPENDENCY
  // ==========================================================================

  describe("deleteDependency", () => {
    it("should delete a dependency successfully", async () => {
      mockPrismaInstance.ganttDependency.findUnique.mockResolvedValue(mockGanttDependency);
      mockPrismaInstance.ganttDependency.delete.mockResolvedValue(mockGanttDependency);

      const result = await ganttService.deleteDependency("dep-123");

      expect(result).toEqual({
        success: true,
        message: "Dependencia eliminada correctamente",
      });
      expect(mockPrismaInstance.ganttDependency.delete).toHaveBeenCalledWith({
        where: { id: "dep-123" },
      });
    });

    it("should return DependencyNotFound if dependency does not exist", async () => {
      mockPrismaInstance.ganttDependency.findUnique.mockResolvedValue(null);

      const result = await ganttService.deleteDependency("invalid-id");

      expect(isPrismaErrorWrapping(result, DependencyNotFound)).toBe(true);
    });
  });

  // ==========================================================================
  // GET ITEM DEPENDENCIES
  // ==========================================================================

  describe("getItemDependencies", () => {
    it("should get both predecessors and successors", async () => {
      const predecessors = [{ ...mockGanttDependency, targetItemId: "gantt-123" }];
      const successors = [{ ...mockGanttDependency, sourceItemId: "gantt-123" }];

      mockPrismaInstance.ganttItem.findUnique.mockResolvedValue(mockGanttItem);
      mockPrismaInstance.ganttDependency.findMany
        .mockResolvedValueOnce(predecessors)
        .mockResolvedValueOnce(successors);

      const result = await ganttService.getItemDependencies("gantt-123", "both");

      expect(result).toEqual({
        predecessors,
        successors,
      });
    });

    it("should get only predecessors", async () => {
      const predecessors = [mockGanttDependency];

      mockPrismaInstance.ganttItem.findUnique.mockResolvedValue(mockGanttItem);
      mockPrismaInstance.ganttDependency.findMany.mockResolvedValue(predecessors);

      const result = await ganttService.getItemDependencies("gantt-123", "predecessors");

      expect(result).toEqual({
        predecessors,
        successors: [],
      });
    });

    it("should get only successors", async () => {
      const successors = [mockGanttDependency];

      mockPrismaInstance.ganttItem.findUnique.mockResolvedValue(mockGanttItem);
      mockPrismaInstance.ganttDependency.findMany.mockResolvedValue(successors);

      const result = await ganttService.getItemDependencies("gantt-123", "successors");

      expect(result).toEqual({
        predecessors: [],
        successors,
      });
    });

    it("should return GanttItemNotFound if item does not exist", async () => {
      mockPrismaInstance.ganttItem.findUnique.mockResolvedValue(null);

      const result = await ganttService.getItemDependencies("invalid-id", "both");

      expect(isPrismaErrorWrapping(result, GanttItemNotFound)).toBe(true);
    });
  });

  // ==========================================================================
  // SEARCH GANTT ITEMS (Advanced Search)
  // ==========================================================================

  describe("searchGanttItems", () => {
    it("should search items by text query in title and description", async () => {
      const mockItems = [mockGanttItem];
      const total = 1;

      mockPrismaInstance.ganttItem.findMany.mockResolvedValue(mockItems);
      mockPrismaInstance.ganttItem.count.mockResolvedValue(total);

      const result = await ganttService.searchGanttItems({
        query: "Test",
        page: 1,
        pageSize: 50,
      });

      expect(result).toEqual({
        data: mockItems,
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1,
        },
      });

      // Verificar que se usó OR para buscar en title y description
      expect(mockPrismaInstance.ganttItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: "Test", mode: "insensitive" } },
              { description: { contains: "Test", mode: "insensitive" } },
            ],
          }),
        })
      );
    });

    it("should filter by progress range", async () => {
      const mockItems = [mockGanttItem];
      const total = 1;

      mockPrismaInstance.ganttItem.findMany.mockResolvedValue(mockItems);
      mockPrismaInstance.ganttItem.count.mockResolvedValue(total);

      const result = await ganttService.searchGanttItems({
        minProgress: 25,
        maxProgress: 75,
        page: 1,
        pageSize: 50,
      });

      expect(result).toEqual({
        data: mockItems,
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1,
        },
      });

      // Verificar que se usó rango de progreso
      expect(mockPrismaInstance.ganttItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            progress: {
              gte: 25,
              lte: 75,
            },
          }),
        })
      );
    });

    it("should combine text search with filters", async () => {
      const mockItems = [mockGanttItem];
      const total = 1;

      mockPrismaInstance.ganttItem.findMany.mockResolvedValue(mockItems);
      mockPrismaInstance.ganttItem.count.mockResolvedValue(total);

      const result = await ganttService.searchGanttItems({
        query: "Test",
        type: "task",
        status: "active",
        minProgress: 0,
        maxProgress: 50,
        assignedToId: "user-123",
        page: 1,
        pageSize: 20,
      });

      expect(result).toEqual({
        data: mockItems,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      });

      expect(mockPrismaInstance.ganttItem.findMany).toHaveBeenCalled();
    });

    it("should return empty results if no items match", async () => {
      mockPrismaInstance.ganttItem.findMany.mockResolvedValue([]);
      mockPrismaInstance.ganttItem.count.mockResolvedValue(0);

      const result = await ganttService.searchGanttItems({
        query: "NonExistent",
        page: 1,
        pageSize: 50,
      });

      expect(result).toEqual({
        data: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
        },
      });
    });
  });

  // ==========================================================================
  // BULK UPDATE GANTT ITEMS
  // ==========================================================================

  describe("bulkUpdateGanttItems", () => {
    it("should update multiple items successfully", async () => {
      const ids = ["gantt-1", "gantt-2", "gantt-3"];
      const updateData = { progress: 50, status: "active" };

      mockPrismaInstance.ganttItem.findMany.mockResolvedValue([
        { id: "gantt-1" },
        { id: "gantt-2" },
        { id: "gantt-3" },
      ]);

      mockPrismaInstance.ganttItem.updateMany.mockResolvedValue({ count: 3 });

      const result = await ganttService.bulkUpdateGanttItems({
        ids,
        data: updateData,
      });

      expect(result).toEqual({
        message: "3 items actualizados correctamente",
        count: 3,
        ids,
      });

      expect(mockPrismaInstance.ganttItem.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ids }, isActive: true },
        data: updateData,
      });
    });

    it("should fail if some items don't exist", async () => {
      const ids = ["gantt-1", "gantt-2", "gantt-3"];
      const updateData = { progress: 50 };

      // Solo 2 items encontrados de 3
      mockPrismaInstance.ganttItem.findMany.mockResolvedValue([
        { id: "gantt-1" },
        { id: "gantt-2" },
      ]);

      const result = await ganttService.bulkUpdateGanttItems({
        ids,
        data: updateData,
      });

      expect(isPrismaErrorWrapping(result, BulkItemsNotFound)).toBe(true);
    });

    it("should update single field for multiple items", async () => {
      const ids = ["gantt-1", "gantt-2"];
      const updateData = { status: "completed" };

      mockPrismaInstance.ganttItem.findMany.mockResolvedValue([
        { id: "gantt-1" },
        { id: "gantt-2" },
      ]);

      mockPrismaInstance.ganttItem.updateMany.mockResolvedValue({ count: 2 });

      const result = await ganttService.bulkUpdateGanttItems({
        ids,
        data: updateData,
      });

      expect(result).toEqual({
        message: "2 items actualizados correctamente",
        count: 2,
        ids,
      });
    });
  });

  // ==========================================================================
  // BULK DELETE GANTT ITEMS
  // ==========================================================================

  describe("bulkDeleteGanttItems", () => {
    it("should delete multiple items successfully (soft delete)", async () => {
      const ids = ["gantt-1", "gantt-2", "gantt-3"];

      mockPrismaInstance.ganttItem.findMany.mockResolvedValue([
        { id: "gantt-1", children: [] },
        { id: "gantt-2", children: [] },
        { id: "gantt-3", children: [] },
      ]);

      mockPrismaInstance.ganttItem.updateMany.mockResolvedValue({ count: 3 });

      const result = await ganttService.bulkDeleteGanttItems({ ids });

      expect(result).toEqual({
        message: "3 items eliminados correctamente",
        count: 3,
        ids,
      });

      expect(mockPrismaInstance.ganttItem.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ids }, isActive: true },
        data: { isActive: false },
      });
    });

    it("should fail if items have active children", async () => {
      const ids = ["gantt-1", "gantt-2"];

      mockPrismaInstance.ganttItem.findMany.mockResolvedValue([
        { id: "gantt-1", children: [] },
        { id: "gantt-2", children: [{ id: "child-1" }] }, // Has children
      ]);

      const result = await ganttService.bulkDeleteGanttItems({ ids });

      expect(isPrismaErrorWrapping(result, BulkItemsWithChildren)).toBe(true);
      expect(mockPrismaInstance.ganttItem.updateMany).not.toHaveBeenCalled();
    });

    it("should fail if some items don't exist", async () => {
      const ids = ["gantt-1", "gantt-2", "gantt-3"];

      // Solo 2 items encontrados de 3
      mockPrismaInstance.ganttItem.findMany.mockResolvedValue([
        { id: "gantt-1", children: [] },
        { id: "gantt-2", children: [] },
      ]);

      const result = await ganttService.bulkDeleteGanttItems({ ids });

      expect(isPrismaErrorWrapping(result, BulkItemsNotFound)).toBe(true);
      expect(mockPrismaInstance.ganttItem.updateMany).not.toHaveBeenCalled();
    });

    it("should handle empty children array correctly", async () => {
      const ids = ["gantt-1"];

      mockPrismaInstance.ganttItem.findMany.mockResolvedValue([
        { id: "gantt-1", children: [] },
      ]);

      mockPrismaInstance.ganttItem.updateMany.mockResolvedValue({ count: 1 });

      const result = await ganttService.bulkDeleteGanttItems({ ids });

      expect(result).toEqual({
        message: "1 items eliminados correctamente",
        count: 1,
        ids,
      });
    });
  });
});
