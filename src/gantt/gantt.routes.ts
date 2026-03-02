import { NextFunction, Router,Request,Response } from "express";
import passport from "passport";
import { validateSchemaMiddleware } from "../auth/auth.schema";
import { GanttController } from "./gantt.controller";
import {
  CreateGanttItemSchema,
  UpdateGanttItemSchema,
  GetGanttItemSchema,
  ListGanttItemsSchema,
  SearchGanttItemsSchema,
  DeleteGanttItemSchema,
  CompleteGanttItemSchema,
  BulkUpdateGanttItemsSchema,
  BulkDeleteGanttItemsSchema,
  CreateDependencySchema,
  UpdateDependencySchema,
  GetDependencySchema,
  ListDependenciesSchema,
  DeleteDependencySchema,
  GetItemDependenciesSchema,
} from "./gantt.schema";

const ganttController = new GanttController();
const ganttRouter = Router();

// ============================================================================
// GANTT ITEM ROUTES
// ============================================================================

/**
 * POST /gantt/items
 * Crear un nuevo item del Gantt
 * Auth: JWT required
 */
ganttRouter.post(
  "/items",
  validateSchemaMiddleware(CreateGanttItemSchema),
  passport.authenticate("jwt", { session: false }),
  ganttController.createGanttItem
);

/**
 * GET /gantt/items
 * Listar items del Gantt con filtros y paginación
 * Auth: JWT required
 */
ganttRouter.get(
  "/items",
  validateSchemaMiddleware(ListGanttItemsSchema),
  passport.authenticate("jwt", { session: false }),
  ganttController.listGanttItems
);

/**
 * GET /gantt/search
 * Búsqueda avanzada de items del Gantt con texto + filtros
 * Auth: JWT required
 * IMPORTANTE: Esta ruta debe ir antes de /items/:id para evitar conflictos
 */
ganttRouter.get(
  "/search",
  validateSchemaMiddleware(SearchGanttItemsSchema),
  passport.authenticate("jwt", { session: false }),
  ganttController.searchGanttItems
);

/**
 * GET /gantt/items/:id
 * Obtener un item del Gantt por ID
 * Auth: JWT required
 */
ganttRouter.get(
  "/items/:id",
  validateSchemaMiddleware(GetGanttItemSchema),
  passport.authenticate("jwt", { session: false }),
  ganttController.getGanttItem
);

/**
 * PUT /gantt/items/:id
 * Actualizar un item del Gantt
 * Auth: JWT required
 */
ganttRouter.put(
  "/items/:id",
  validateSchemaMiddleware(UpdateGanttItemSchema),
  passport.authenticate("jwt", { session: false }),
  ganttController.updateGanttItem
);

/**
 * DELETE /gantt/items/:id
 * Eliminar un item del Gantt (soft delete)
 * Auth: JWT required
 */
ganttRouter.delete(
  "/items/:id",
  validateSchemaMiddleware(DeleteGanttItemSchema),
  passport.authenticate("jwt", { session: false }),
  ganttController.deleteGanttItem
);

/**
 * POST /gantt/items/:id/complete
 * Marcar un item como completado
 * Auth: JWT required
 */
ganttRouter.post(
  "/items/:id/complete",
  validateSchemaMiddleware(CompleteGanttItemSchema),
  passport.authenticate("jwt", { session: false }),
  ganttController.completeGanttItem
);

/**
 * PUT /gantt/bulk-update
 * Actualizar múltiples items del Gantt simultáneamente
 * Auth: JWT required
 */
ganttRouter.put(
  "/bulk-update",
  validateSchemaMiddleware(BulkUpdateGanttItemsSchema),
  passport.authenticate("jwt", { session: false }),
  ganttController.bulkUpdateGanttItems
);

/**
 * POST /gantt/bulk-delete
 * Eliminar múltiples items del Gantt simultáneamente (soft delete)
 * Auth: JWT required
 */
ganttRouter.post(
  "/bulk-delete",
  validateSchemaMiddleware(BulkDeleteGanttItemsSchema),
  passport.authenticate("jwt", { session: false }),
  ganttController.bulkDeleteGanttItems
);

/**
 * GET /gantt/items/:itemId/dependencies
 * Obtener dependencias de un item (predecessors y successors)
 * Auth: JWT required
 */
ganttRouter.get(
  "/items/:itemId/dependencies",
  validateSchemaMiddleware(GetItemDependenciesSchema),
  passport.authenticate("jwt", { session: false }),
  ganttController.getItemDependencies
);

// ============================================================================
// GANTT DEPENDENCY ROUTES
// ============================================================================

/**
 * POST /gantt/dependencies
 * Crear una nueva dependencia
 * Auth: JWT required
 */
ganttRouter.post(
  "/dependencies",
  validateSchemaMiddleware(CreateDependencySchema),
  passport.authenticate("jwt", { session: false }),
  ganttController.createDependency
);

/**
 * GET /gantt/dependencies
 * Listar dependencias con filtros
 * Auth: JWT required
 */
ganttRouter.get(
  "/dependencies",
  validateSchemaMiddleware(ListDependenciesSchema),
  passport.authenticate("jwt", { session: false }),
  ganttController.listDependencies
);

/**
 * GET /gantt/dependencies/:id
 * Obtener una dependencia por ID
 * Auth: JWT required
 */
ganttRouter.get(
  "/dependencies/:id",
  validateSchemaMiddleware(GetDependencySchema),
  passport.authenticate("jwt", { session: false }),
  ganttController.getDependency
);

/**
 * PUT /gantt/dependencies/:id
 * Actualizar una dependencia
 * Auth: JWT required
 */
ganttRouter.put(
  "/dependencies/:id",
  validateSchemaMiddleware(UpdateDependencySchema),
  passport.authenticate("jwt", { session: false }),
  ganttController.updateDependency
);

/**
 * DELETE /gantt/dependencies/:id
 * Eliminar una dependencia
 * Auth: JWT required
 */
ganttRouter.delete(
  "/dependencies/:id",
  validateSchemaMiddleware(DeleteDependencySchema),
  passport.authenticate("jwt", { session: false }),
  ganttController.deleteDependency
);

export default ganttRouter;
