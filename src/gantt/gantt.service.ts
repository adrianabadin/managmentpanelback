import { PrismaClient } from "@prisma/client";
import { logger } from "../Global.Services/logger";
import { returnPrismaError } from "../prisma/prisma.errors";
import { prismaClient } from "../app.middleware";
import {
  CreateGanttItemInputType,
  UpdateGanttItemInputType,
  BulkUpdateGanttItemsInputType,
  ListGanttItemsType,
  SearchGanttItemsType,
  BulkDeleteGanttItemsType,
  CreateDependencyInputType,
  UpdateDependencyInputType,
  ListDependenciesType,
} from "./gantt.schema";
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
  InvalidMaterializedPath,
  DependencyNotFound,
  CircularDependency,
  SelfDependency,
  DuplicateDependency,
  DependencyItemNotFound,
  InvalidDepartmentReference,
  InvalidDemographyReference,
  InvalidUserReference,
  GanttDatabaseError,
  BulkItemsNotFound,
  BulkItemsWithChildren,
} from "./gantt.errors";

const MAX_HIERARCHY_DEPTH = 10;

export class GanttService {
  constructor(protected prisma = new PrismaClient()) {
    // Bind all methods to preserve 'this' context
    this.createGanttItem = this.createGanttItem.bind(this);
    this.updateGanttItem = this.updateGanttItem.bind(this);
    this.getGanttItem = this.getGanttItem.bind(this);
    this.listGanttItems = this.listGanttItems.bind(this);
    this.searchGanttItems = this.searchGanttItems.bind(this);
    this.deleteGanttItem = this.deleteGanttItem.bind(this);
    this.completeGanttItem = this.completeGanttItem.bind(this);
    this.createDependency = this.createDependency.bind(this);
    this.updateDependency = this.updateDependency.bind(this);
    this.getDependency = this.getDependency.bind(this);
    this.listDependencies = this.listDependencies.bind(this);
    this.deleteDependency = this.deleteDependency.bind(this);
    this.getItemDependencies = this.getItemDependencies.bind(this);
    this.detectCircularDependency = this.detectCircularDependency.bind(this);
    this.detectCircularHierarchy = this.detectCircularHierarchy.bind(this);
    this.calculateMaterializedPath = this.calculateMaterializedPath.bind(this);
    this.validateReferences = this.validateReferences.bind(this);
    this.bulkUpdateGanttItems = this.bulkUpdateGanttItems.bind(this);
    this.bulkDeleteGanttItems = this.bulkDeleteGanttItems.bind(this);
  }

  // ============================================================================
  // GANTT ITEM - CRUD OPERATIONS
  // ============================================================================

  /**
   * Crear un nuevo item del Gantt
   * Validaciones: fechas, referencias FK, jerarquía, materialized path
   */
  async createGanttItem(data: CreateGanttItemInputType) {
    try {
      // Validar rango de fechas (startDate < endDate) para non-milestones
      if (data.type !== "milestone" && data.startDate && data.endDate) {
        if (new Date(data.startDate) >= new Date(data.endDate)) {
          throw new InvalidDateRange();
        }
      }

      // Validar que milestones tengan la misma fecha de inicio y fin
      if (data.type === "milestone" && data.startDate && data.endDate) {
        const start = new Date(data.startDate).getTime();
        const end = new Date(data.endDate).getTime();
        if (start !== end) {
          throw new MilestoneInvalidDates();
        }
      }

      // Validar que summaries no tengan assignee
      if (data.type === "summary" && data.assignedToId) {
        throw new SummaryCannotHaveAssignee();
      }

      // Validar progreso (0-100)
      if (data.progress !== undefined && (data.progress < 0 || data.progress > 100)) {
        throw new InvalidProgress();
      }

      // Validar referencias a departamento, demografía y usuarios
      await this.validateReferences({
        departmentsId: data.departmentsId,
        demographyId: data.demographyId,
        assignedToId: data.assignedToId,
        createdById: data.createdById,
      });

      // Validar jerarquía si tiene parent
      let depth = 0; // Por defecto, items root tienen depth=0
      let parentPath = "/";

      if (data.parentId) {
        const parent = await this.prisma.ganttItem.findUnique({
          where: { id: data.parentId, isActive: true },
          select: { depth: true, path: true },
        });

        if (!parent) {
          throw new InvalidParentReference();
        }

        parentPath = parent.path;
        depth = parent.depth + 1; // Hijos tienen depth = parent.depth + 1

        // Validar profundidad máxima
        if (depth > MAX_HIERARCHY_DEPTH) {
          throw new MaxDepthExceeded();
        }
      }

      // Crear el item dentro de una transacción
      const item = await this.prisma.$transaction(async (tx) => {
        const newItem = await tx.ganttItem.create({
          data: {
            ...data,
            depth,
            path: "/", // Se actualizará después con el ID
          },
          include: {
            department: true,
            demography: true,
            assignedTo: {
              select: {
                id: true,
                name: true,
                lastname: true,
                username: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                lastname: true,
                username: true,
              },
            },
            parent: true,
          },
        });

        // Calcular y actualizar materialized path
        const calculatedPath = this.calculateMaterializedPath(
          parentPath,
          newItem.id
        );

        const updatedItem = await tx.ganttItem.update({
          where: { id: newItem.id },
          data: { path: calculatedPath },
          include: {
            department: true,
            demography: true,
            assignedTo: {
              select: {
                id: true,
                name: true,
                lastname: true,
                username: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                lastname: true,
                username: true,
              },
            },
            parent: true,
          },
        });

        return updatedItem;
      });

      logger.debug({
        function: "GanttService.createGanttItem",
        itemId: item.id,
        title: item.title,
      });

      return item;
    } catch (err) {
      const error = returnPrismaError(err as Error);
      logger.error({ function: "GanttService.createGanttItem", error });
      return error;
    }
  }

  /**
   * Actualizar un item del Gantt
   * Validaciones: fechas, jerarquía circular, profundidad
   */
  async updateGanttItem(id: string, data: UpdateGanttItemInputType) {
    try {
      // Verificar que el item existe
      const existingItem = await this.prisma.ganttItem.findUnique({
        where: { id, isActive: true },
        select: { id: true, parentId: true, depth: true, path: true, type: true, startDate: true, endDate: true },
      });

      if (!existingItem) {
        throw new GanttItemNotFound();
      }

      // Determinar el tipo (usa el nuevo tipo o el existente)
      const itemType = data.type || existingItem.type;

      // Determinar las fechas (usa las nuevas o las existentes)
      const startDate = data.startDate || existingItem.startDate;
      const endDate = data.endDate || existingItem.endDate;

      // Validar rango de fechas para non-milestones
      if (itemType !== "milestone" && startDate && endDate) {
        if (new Date(startDate) >= new Date(endDate)) {
          throw new InvalidDateRange();
        }
      }

      // Validar que milestones tengan la misma fecha
      if (itemType === "milestone" && startDate && endDate) {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        if (start !== end) {
          throw new MilestoneInvalidDates();
        }
      }

      // Validar que summaries no tengan assignee
      if (itemType === "summary" && data.assignedToId) {
        throw new SummaryCannotHaveAssignee();
      }

      // Validar progreso (0-100)
      if (data.progress !== undefined && (data.progress < 0 || data.progress > 100)) {
        throw new InvalidProgress();
      }

      // Validar referencias si se están actualizando
      await this.validateReferences({
        departmentsId: data.departmentsId ?? undefined,
        demographyId: data.demographyId ?? undefined,
        assignedToId: data.assignedToId ?? undefined,
      });

      // Si se está cambiando el parent, validar jerarquía
      let updateData: Record<string, unknown> = { ...data };

      if (data.parentId !== undefined) {
        if (data.parentId === null) {
          // Mover a root
          updateData.depth = 0;
          updateData.path = `/${id}/`;
        } else {
          // Validar que no se cree un ciclo
          await this.detectCircularHierarchy(id, data.parentId);

          // Obtener datos del nuevo parent
          const newParent = await this.prisma.ganttItem.findUnique({
            where: { id: data.parentId, isActive: true },
            select: { depth: true, path: true },
          });

          if (!newParent) {
            throw new InvalidParentReference();
          }

          // Validar profundidad máxima
          if (newParent.depth + 1 > MAX_HIERARCHY_DEPTH) {
            throw new MaxDepthExceeded();
          }

          updateData.depth = newParent.depth + 1;
          updateData.path = this.calculateMaterializedPath(
            newParent.path,
            id
          );
        }
      }

      // Actualizar el item
      const updatedItem = await this.prisma.ganttItem.update({
        where: { id },
        data: updateData,
        include: {
          department: true,
          demography: true,
          assignedTo: {
            select: {
              id: true,
              name: true,
              lastname: true,
              username: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              lastname: true,
              username: true,
            },
          },
          parent: true,
        },
      });

      logger.debug({
        function: "GanttService.updateGanttItem",
        itemId: id,
      });

      return updatedItem;
    } catch (err) {
      const error = returnPrismaError(err as Error);
      logger.error({ function: "GanttService.updateGanttItem", error });
      return error;
    }
  }

  /**
   * Obtener un item del Gantt por ID
   */
  async getGanttItem(id: string, includeRelations = true) {
    try {
      const item = await this.prisma.ganttItem.findUnique({
        where: { id, isActive: true },
        include: includeRelations
          ? {
              department: true,
              demography: true,
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                  lastname: true,
                  username: true,
                },
              },
              createdBy: {
                select: {
                  id: true,
                  name: true,
                  lastname: true,
                  username: true,
                },
              },
              parent: true,
              children: {
                where: { isActive: true },
                orderBy: { sortOrder: "asc" },
              },
              dependenciesFrom: {
                include: {
                  targetItem: {
                    select: { id: true, title: true, status: true },
                  },
                },
              },
              dependenciesTo: {
                include: {
                  sourceItem: {
                    select: { id: true, title: true, status: true },
                  },
                },
              },
            }
          : undefined,
      });

      if (!item) {
        throw new GanttItemNotFound();
      }

      return item;
    } catch (err) {
      const error = returnPrismaError(err as Error);
      logger.error({ function: "GanttService.getGanttItem", error });
      return error;
    }
  }

  /**
   * Listar items del Gantt con filtros y paginación
   */
  async listGanttItems(filters?: ListGanttItemsType) {
    try {
      const page = filters?.page || 1;
      // Support both 'limit' and 'pageSize' for backward compatibility
      const pageSize = parseInt((filters as any)?.limit) || parseInt(filters?.pageSize as any) || 50;
      const skip = (page - 1) * pageSize;

      // Construir where clause
      const where: Record<string, unknown> = {
        isActive: filters?.isActive === "false" ? false : true,
      };

      if (filters?.departmentsId) where.departmentsId = filters.departmentsId;
      if (filters?.demographyId) where.demographyId = filters.demographyId;
      if (filters?.assignedToId) where.assignedToId = filters.assignedToId;
      if (filters?.createdById) where.createdById = filters.createdById;
      if (filters?.parentId) where.parentId = filters.parentId;
      if (filters?.status) where.status = filters.status;
      if (filters?.priority) where.priority = filters.priority;
      if (filters?.type) where.type = filters.type;

      // Filtros de rango de fechas
      if (filters?.startDateFrom || filters?.startDateTo) {
        const startDateFilter: Record<string, Date> = {};
        if (filters.startDateFrom)
          startDateFilter.gte = new Date(filters.startDateFrom);
        if (filters.startDateTo)
          startDateFilter.lte = new Date(filters.startDateTo);
        where.startDate = startDateFilter;
      }

      if (filters?.endDateFrom || filters?.endDateTo) {
        const endDateFilter: Record<string, Date> = {};
        if (filters.endDateFrom)
          endDateFilter.gte = new Date(filters.endDateFrom);
        if (filters.endDateTo)
          endDateFilter.lte = new Date(filters.endDateTo);
        where.endDate = endDateFilter;
      }

      // Ejecutar query con paginación
      const [items, total] = await Promise.all([
        this.prisma.ganttItem.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: [{ startDate: "asc" }, { sortOrder: "asc" }],
          include: {
            department: {
              select: { id: true, name: true },
            },
            demography: {
              select: { id: true, state: true },
            },
            assignedTo: {
              select: {
                id: true,
                name: true,
                lastname: true,
                username: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                lastname: true,
              },
            },
            parent: {
              select: { id: true, title: true },
            },
            children:
              filters?.includeChildren === "true"
                ? {
                    where: { isActive: true },
                    orderBy: { sortOrder: "asc" },
                  }
                : false,
            dependenciesFrom:
              filters?.includeDependencies === "true"
                ? {
                    include: {
                      targetItem: {
                        select: { id: true, title: true, status: true },
                      },
                    },
                  }
                : false,
            dependenciesTo:
              filters?.includeDependencies === "true"
                ? {
                    include: {
                      sourceItem: {
                        select: { id: true, title: true, status: true },
                      },
                    },
                  }
                : false,
          },
        }),
        this.prisma.ganttItem.count({ where }),
      ]);

      return {
        data: items,
        pagination: {
          page,
          limit: pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    } catch (err) {
      const error = returnPrismaError(err as Error);
      logger.error({ function: "GanttService.listGanttItems", error });
      return error;
    }
  }

  /**
   * Búsqueda avanzada de items del Gantt
   * Permite buscar por texto en title/description + todos los filtros de listGanttItems + rango de progreso
   */
  async searchGanttItems(filters?: SearchGanttItemsType) {
    try {
      const page = filters?.page || 1;
      const pageSize = (filters as any)?.limit || filters?.pageSize || 50;
      const skip = (page - 1) * pageSize;

      // Construir where clause
      const where: Record<string, unknown> = {
        isActive: filters?.isActive === "false" ? false : true,
      };

      // Búsqueda de texto en title y description (case-insensitive con regex)
      if (filters?.query) {
        where.OR = [
          { title: { contains: filters.query, mode: "insensitive" } },
          { description: { contains: filters.query, mode: "insensitive" } },
        ];
      }

      // Filtros exactos
      if (filters?.departmentsId) where.departmentsId = filters.departmentsId;
      if (filters?.demographyId) where.demographyId = filters.demographyId;
      if (filters?.assignedToId) where.assignedToId = filters.assignedToId;
      if (filters?.createdById) where.createdById = filters.createdById;
      if (filters?.parentId) where.parentId = filters.parentId;
      if (filters?.status) where.status = filters.status;
      if (filters?.priority) where.priority = filters.priority;
      if (filters?.type) where.type = filters.type;

      // Filtros de rango de fechas
      if (filters?.startDateFrom || filters?.startDateTo) {
        const startDateFilter: Record<string, Date> = {};
        if (filters.startDateFrom)
          startDateFilter.gte = new Date(filters.startDateFrom);
        if (filters.startDateTo)
          startDateFilter.lte = new Date(filters.startDateTo);
        where.startDate = startDateFilter;
      }

      if (filters?.endDateFrom || filters?.endDateTo) {
        const endDateFilter: Record<string, Date> = {};
        if (filters.endDateFrom)
          endDateFilter.gte = new Date(filters.endDateFrom);
        if (filters.endDateTo)
          endDateFilter.lte = new Date(filters.endDateTo);
        where.endDate = endDateFilter;
      }

      // Filtros de rango de progreso
      if (filters?.minProgress !== undefined || filters?.maxProgress !== undefined) {
        const progressFilter: Record<string, number> = {};
        if (filters.minProgress !== undefined)
          progressFilter.gte = filters.minProgress;
        if (filters.maxProgress !== undefined)
          progressFilter.lte = filters.maxProgress;
        where.progress = progressFilter;
      }

      // Ejecutar query con paginación
      const [items, total] = await Promise.all([
        this.prisma.ganttItem.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: [{ startDate: "asc" }, { sortOrder: "asc" }],
          include: {
            department: {
              select: { id: true, name: true },
            },
            demography: {
              select: { id: true, state: true },
            },
            assignedTo: {
              select: {
                id: true,
                name: true,
                lastname: true,
                username: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                lastname: true,
              },
            },
            parent: {
              select: { id: true, title: true },
            },
            children:
              filters?.includeChildren === "true"
                ? {
                    where: { isActive: true },
                    orderBy: { sortOrder: "asc" },
                  }
                : false,
            dependenciesFrom:
              filters?.includeDependencies === "true"
                ? {
                    include: {
                      targetItem: {
                        select: { id: true, title: true, status: true },
                      },
                    },
                  }
                : false,
            dependenciesTo:
              filters?.includeDependencies === "true"
                ? {
                    include: {
                      sourceItem: {
                        select: { id: true, title: true, status: true },
                      },
                    },
                  }
                : false,
          },
        }),
        this.prisma.ganttItem.count({ where }),
      ]);

      logger.debug({
        function: "GanttService.searchGanttItems",
        filters,
        resultsCount: total,
      });

      return {
        data: items,
        pagination: {
          page,
          limit: pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    } catch (err) {
      const error = returnPrismaError(err as Error);
      logger.error({ function: "GanttService.searchGanttItems", error });
      return error;
    }
  }

  /**
   * Eliminar un item del Gantt (soft delete)
   * Validación: no puede tener hijos activos
   */
  async deleteGanttItem(id: string) {
    try {
      // Verificar que existe y no tiene hijos activos
      const item = await this.prisma.ganttItem.findUnique({
        where: { id, isActive: true },
        include: {
          children: {
            where: { isActive: true },
          },
        },
      });

      if (!item) {
        throw new GanttItemNotFound();
      }

      if (item.children.length > 0) {
        throw new CannotDeleteItemWithChildren();
      }

      // Soft delete
      const deletedItem = await this.prisma.ganttItem.update({
        where: { id },
        data: { isActive: false },
      });

      logger.debug({
        function: "GanttService.deleteGanttItem",
        itemId: id,
      });

      return {
        message: "Item eliminado correctamente",
        id: deletedItem.id,
      };
    } catch (err) {
      const error = returnPrismaError(err as Error);
      logger.error({ function: "GanttService.deleteGanttItem", error });
      return error;
    }
  }

  /**
   * Marcar un item como completado
   */
  async completeGanttItem(
    id: string,
    actualHours?: number,
    completedAt?: Date
  ) {
    try {
      const item = await this.prisma.ganttItem.findUnique({
        where: { id, isActive: true },
      });

      if (!item) {
        throw new GanttItemNotFound();
      }

      const updatedItem = await this.prisma.ganttItem.update({
        where: { id },
        data: {
          status: "completed",
          progress: 100,
          actualHours: actualHours || item.actualHours,
          completedAt: completedAt || new Date(),
        },
      });

      logger.debug({
        function: "GanttService.completeGanttItem",
        itemId: id,
      });

      return updatedItem;
    } catch (err) {
      const error = returnPrismaError(err as Error);
      logger.error({ function: "GanttService.completeGanttItem", error });
      return error;
    }
  }

  /**
   * Actualizar múltiples items del Gantt simultáneamente
   * Utiliza transacciones para asegurar atomicidad
   */
  async bulkUpdateGanttItems(data: BulkUpdateGanttItemsInputType) {
    try {
      const { ids, data: updateData } = data;

      // Validar que todos los items existan
      const existingItems = await this.prisma.ganttItem.findMany({
        where: {
          id: { in: ids },
          isActive: true,
        },
        select: { id: true },
      });

      if (existingItems.length !== ids.length) {
        const foundIds = existingItems.map((item) => item.id);
        const missingIds = ids.filter((id) => !foundIds.includes(id));
        throw new BulkItemsNotFound(
          missingIds,
          `Los siguientes items no fueron encontrados: ${missingIds.join(", ")}`
        );
      }

      // Usar transacción para actualizar todos los items atómicamente
      const result = await this.prisma.$transaction(async (tx) => {
        const updatedItems = await tx.ganttItem.updateMany({
          where: {
            id: { in: ids },
            isActive: true,
          },
          data: updateData,
        });

        return updatedItems;
      });

      logger.debug({
        function: "GanttService.bulkUpdateGanttItems",
        idsCount: ids.length,
        updatedCount: result.count,
      });

      return {
        message: `${result.count} items actualizados correctamente`,
        count: result.count,
        ids,
      };
    } catch (err) {
      const error = returnPrismaError(err as Error);
      logger.error({ function: "GanttService.bulkUpdateGanttItems", error });
      return error;
    }
  }

  /**
   * Eliminar múltiples items del Gantt simultáneamente (soft delete)
   * Utiliza transacciones para asegurar atomicidad
   * Validación: ningún item puede tener hijos activos
   */
  async bulkDeleteGanttItems(data: BulkDeleteGanttItemsType) {
    try {
      const { ids } = data;

      // Validar que todos los items existan y no tengan hijos activos
      const items = await this.prisma.ganttItem.findMany({
        where: {
          id: { in: ids },
          isActive: true,
        },
        include: {
          children: {
            where: { isActive: true },
          },
        },
      });

      if (items.length !== ids.length) {
        const foundIds = items.map((item) => item.id);
        const missingIds = ids.filter((id) => !foundIds.includes(id));
        throw new BulkItemsNotFound(
          missingIds,
          `Los siguientes items no fueron encontrados: ${missingIds.join(", ")}`
        );
      }

      // Verificar que ningún item tenga hijos activos
      const itemsWithChildren = items.filter(
        (item) => item.children.length > 0
      );
      if (itemsWithChildren.length > 0) {
        const idsWithChildren = itemsWithChildren.map((item) => item.id);
        throw new BulkItemsWithChildren(
          idsWithChildren,
          `Los siguientes items no pueden ser eliminados porque tienen hijos activos: ${idsWithChildren.join(", ")}`
        );
      }

      // Usar transacción para eliminar todos los items atómicamente
      const result = await this.prisma.$transaction(async (tx) => {
        const deletedItems = await tx.ganttItem.updateMany({
          where: {
            id: { in: ids },
            isActive: true,
          },
          data: { isActive: false },
        });

        return deletedItems;
      });

      logger.debug({
        function: "GanttService.bulkDeleteGanttItems",
        idsCount: ids.length,
        deletedCount: result.count,
      });

      return {
        message: `${result.count} items eliminados correctamente`,
        count: result.count,
        ids,
      };
    } catch (err) {
      const error = returnPrismaError(err as Error);
      logger.error({ function: "GanttService.bulkDeleteGanttItems", error });
      return error;
    }
  }

  // ============================================================================
  // GANTT DEPENDENCY - CRUD OPERATIONS
  // ============================================================================

  /**
   * Crear una dependencia entre dos items
   * Validaciones: items existen, no es self-dependency, no crea ciclo
   */
  async createDependency(data: CreateDependencyInputType) {
    try {
      // Validar que ambos items existen
      const [sourceItem, targetItem] = await Promise.all([
        this.prisma.ganttItem.findUnique({
          where: { id: data.sourceItemId, isActive: true },
        }),
        this.prisma.ganttItem.findUnique({
          where: { id: data.targetItemId, isActive: true },
        }),
      ]);

      if (!sourceItem || !targetItem) {
        throw new DependencyItemNotFound();
      }

      // Validar que no sea self-dependency (redundante con Zod, pero por seguridad)
      if (data.sourceItemId === data.targetItemId) {
        throw new SelfDependency();
      }

      // Detectar dependencia circular
      await this.detectCircularDependency(
        data.sourceItemId,
        data.targetItemId
      );

      // Crear la dependencia
      const dependency = await this.prisma.ganttDependency.create({
        data,
        include: {
          sourceItem: {
            select: { id: true, title: true, status: true },
          },
          targetItem: {
            select: { id: true, title: true, status: true },
          },
        },
      });

      logger.debug({
        function: "GanttService.createDependency",
        dependencyId: dependency.id,
        source: data.sourceItemId,
        target: data.targetItemId,
      });

      return dependency;
    } catch (err) {
      const error = returnPrismaError(err as Error);
      logger.error({ function: "GanttService.createDependency", error });
      return error;
    }
  }

  /**
   * Actualizar una dependencia
   */
  async updateDependency(id: string, data: UpdateDependencyInputType) {
    try {
      const dependency = await this.prisma.ganttDependency.findUnique({
        where: { id },
      });

      if (!dependency) {
        throw new DependencyNotFound();
      }

      const updatedDependency = await this.prisma.ganttDependency.update({
        where: { id },
        data,
        include: {
          sourceItem: {
            select: { id: true, title: true, status: true },
          },
          targetItem: {
            select: { id: true, title: true, status: true },
          },
        },
      });

      logger.debug({
        function: "GanttService.updateDependency",
        dependencyId: id,
      });

      return updatedDependency;
    } catch (err) {
      const error = returnPrismaError(err as Error);
      logger.error({ function: "GanttService.updateDependency", error });
      return error;
    }
  }

  /**
   * Obtener una dependencia por ID
   */
  async getDependency(id: string) {
    try {
      const dependency = await this.prisma.ganttDependency.findUnique({
        where: { id },
        include: {
          sourceItem: {
            select: {
              id: true,
              title: true,
              status: true,
              startDate: true,
              endDate: true,
            },
          },
          targetItem: {
            select: {
              id: true,
              title: true,
              status: true,
              startDate: true,
              endDate: true,
            },
          },
        },
      });

      if (!dependency) {
        throw new DependencyNotFound();
      }

      return dependency;
    } catch (err) {
      const error = returnPrismaError(err as Error);
      logger.error({ function: "GanttService.getDependency", error });
      return error;
    }
  }

  /**
   * Listar dependencias con filtros
   */
  async listDependencies(filters?: ListDependenciesType) {
    try {
      const where: Record<string, unknown> = {};

      if (filters?.sourceItemId) where.sourceItemId = filters.sourceItemId;
      if (filters?.targetItemId) where.targetItemId = filters.targetItemId;
      if (filters?.type) where.type = filters.type;

      const dependencies = await this.prisma.ganttDependency.findMany({
        where,
        include: {
          sourceItem: {
            select: { id: true, title: true, status: true },
          },
          targetItem: {
            select: { id: true, title: true, status: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return dependencies;
    } catch (err) {
      const error = returnPrismaError(err as Error);
      logger.error({ function: "GanttService.listDependencies", error });
      return error;
    }
  }

  /**
   * Eliminar una dependencia
   */
  async deleteDependency(id: string) {
    try {
      const dependency = await this.prisma.ganttDependency.findUnique({
        where: { id },
      });

      if (!dependency) {
        throw new DependencyNotFound();
      }

      await this.prisma.ganttDependency.delete({
        where: { id },
      });

      logger.debug({
        function: "GanttService.deleteDependency",
        dependencyId: id,
      });

      return { success: true, message: "Dependencia eliminada correctamente" };
    } catch (err) {
      const error = returnPrismaError(err as Error);
      logger.error({ function: "GanttService.deleteDependency", error });
      return error;
    }
  }

  /**
   * Obtener dependencias de un item (predecessors y successors)
   */
  async getItemDependencies(
    itemId: string,
    direction: "predecessors" | "successors" | "both" = "both"
  ) {
    try {
      const item = await this.prisma.ganttItem.findUnique({
        where: { id: itemId, isActive: true },
      });

      if (!item) {
        throw new GanttItemNotFound();
      }

      const result: any = {
        predecessors: [],
        successors: [],
      };

      if (direction === "predecessors" || direction === "both") {
        result.predecessors = await this.prisma.ganttDependency.findMany({
          where: { targetItemId: itemId },
          include: {
            sourceItem: {
              select: {
                id: true,
                title: true,
                status: true,
                startDate: true,
                endDate: true,
              },
            },
          },
        });
      }

      if (direction === "successors" || direction === "both") {
        result.successors = await this.prisma.ganttDependency.findMany({
          where: { sourceItemId: itemId },
          include: {
            targetItem: {
              select: {
                id: true,
                title: true,
                status: true,
                startDate: true,
                endDate: true,
              },
            },
          },
        });
      }

      return result;
    } catch (err) {
      const error = returnPrismaError(err as Error);
      logger.error({ function: "GanttService.getItemDependencies", error });
      return error;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Detectar dependencia circular usando DFS (Depth-First Search)
   * Si agregar la dependencia source -> target crea un ciclo, lanza error
   */
  private async detectCircularDependency(
    sourceId: string,
    targetId: string
  ): Promise<void> {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = async (currentId: string): Promise<boolean> => {
      // Si desde target llegamos a source, agregar la dependencia crearía un ciclo
      if (currentId === sourceId) {
        return true;
      }

      if (recursionStack.has(currentId)) {
        return true; // Ciclo detectado
      }

      if (visited.has(currentId)) {
        return false; // Ya visitado, no hay ciclo por esta rama
      }

      visited.add(currentId);
      recursionStack.add(currentId);

      // Obtener todos los successors del currentId
      const dependencies = await this.prisma.ganttDependency.findMany({
        where: { sourceItemId: currentId },
        select: { targetItemId: true },
      });

      for (const dep of dependencies) {
        if (await dfs(dep.targetItemId)) {
          return true; // Ciclo detectado
        }
      }

      recursionStack.delete(currentId);
      return false;
    };

    // Simular la nueva dependencia: si desde target podemos llegar a source, hay ciclo
    if (await dfs(targetId)) {
      throw new CircularDependency();
    }

    // Verificar también si source == target (redundante con validación Zod)
    if (sourceId === targetId) {
      throw new SelfDependency();
    }
  }

  /**
   * Detectar jerarquía circular
   * Si mover itemId bajo newParentId crea un ciclo, lanza error
   */
  private async detectCircularHierarchy(
    itemId: string,
    newParentId: string
  ): Promise<void> {
    let currentId: string | null = newParentId;

    while (currentId) {
      if (currentId === itemId) {
        throw new CircularHierarchy();
      }

      const parent: { parentId: string | null } | null = await this.prisma.ganttItem.findUnique({
        where: { id: currentId, isActive: true },
        select: { parentId: true },
      });

      currentId = parent?.parentId || null;
    }
  }

  /**
   * Calcular materialized path
   * Formato: /parentId1/parentId2/itemId/
   */
  private calculateMaterializedPath(
    parentPath: string,
    itemId: string
  ): string {
    if (parentPath === "/") {
      return `/${itemId}/`;
    }
    return `${parentPath}${itemId}/`;
  }

  /**
   * Validar que las referencias FK existen
   */
  private async validateReferences(refs: {
    departmentsId?: string;
    demographyId?: string;
    assignedToId?: string;
    createdById?: string;
  }): Promise<void> {
    const promises: Promise<any>[] = [];

    if (refs.departmentsId) {
      promises.push(
        this.prisma.departments
          .findUniqueOrThrow({
            where: { id: refs.departmentsId, isActive: true },
          })
          .catch(() => {
            throw new InvalidDepartmentReference();
          })
      );
    }

    if (refs.demographyId) {
      promises.push(
        this.prisma.demography
          .findUniqueOrThrow({ where: { id: refs.demographyId } })
          .catch(() => {
            throw new InvalidDemographyReference();
          })
      );
    }

    if (refs.assignedToId) {
      promises.push(
        this.prisma.users
          .findUniqueOrThrow({
            where: { id: refs.assignedToId, isActive: true },
          })
          .catch(() => {
            throw new InvalidUserReference();
          })
      );
    }

    if (refs.createdById) {
      promises.push(
        this.prisma.users
          .findUniqueOrThrow({
            where: { id: refs.createdById, isActive: true },
          })
          .catch(() => {
            throw new InvalidUserReference();
          })
      );
    }

    await Promise.all(promises);
  }
}
