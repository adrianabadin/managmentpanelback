import { Request, Response } from "express";
import { logger } from "../Global.Services/logger";
import { GanttService } from "./gantt.service";
import { PrismaError } from "../prisma/prisma.errors";
import { GanttError } from "./gantt.errors";
import {
  CreateGanttItemType,
  UpdateGanttItemType,
  GetGanttItemType,
  ListGanttItemsType,
  SearchGanttItemsType,
  DeleteGanttItemType,
  CompleteGanttItemType,
  BulkUpdateGanttItemsType,
  BulkDeleteGanttItemsType,
  CreateDependencyType,
  UpdateDependencyType,
  GetDependencyType,
  ListDependenciesType,
  DeleteDependencyType,
  GetItemDependenciesType,
} from "./gantt.schema";

const ganttService = new GanttService();

export class GanttController {
  constructor(protected service = ganttService) {
    // Bind all methods to preserve 'this' context
    this.createGanttItem = this.createGanttItem.bind(this);
    this.updateGanttItem = this.updateGanttItem.bind(this);
    this.getGanttItem = this.getGanttItem.bind(this);
    this.listGanttItems = this.listGanttItems.bind(this);
    this.searchGanttItems = this.searchGanttItems.bind(this);
    this.deleteGanttItem = this.deleteGanttItem.bind(this);
    this.completeGanttItem = this.completeGanttItem.bind(this);
    this.bulkUpdateGanttItems = this.bulkUpdateGanttItems.bind(this);
    this.bulkDeleteGanttItems = this.bulkDeleteGanttItems.bind(this);
    this.createDependency = this.createDependency.bind(this);
    this.updateDependency = this.updateDependency.bind(this);
    this.getDependency = this.getDependency.bind(this);
    this.listDependencies = this.listDependencies.bind(this);
    this.deleteDependency = this.deleteDependency.bind(this);
    this.getItemDependencies = this.getItemDependencies.bind(this);
  }

  // ============================================================================
  // GANTT ITEM CONTROLLERS
  // ============================================================================

  /**
   * POST /gantt/items
   * Crear un nuevo item del Gantt
   */
  async createGanttItem(
    req: Request<any, any, CreateGanttItemType>,
    res: Response
  ) {
    try {
      // Extraer createdById del usuario autenticado (JWT)
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).send({
          error: "Unauthorized",
          message: "Usuario no autenticado",
        });
      }

      // Agregar createdById del usuario autenticado
      const data = {
        ...req.body,
        createdById: userId,
      };

      const response = await this.service.createGanttItem(data);

      if (response instanceof PrismaError || response instanceof GanttError) {
        logger.error({ function: "GanttController.createGanttItem", error: response });
        return res.status(400).send(response);
      }

      return res.status(201).send(response);
    } catch (error) {
      logger.error({ function: "GanttController.createGanttItem", error });
      return res.status(500).send({
        error: "Internal Server Error",
        message: "Error al crear item del Gantt",
      });
    }
  }

  /**
   * PUT /gantt/items/:id
   * Actualizar un item del Gantt
   */
  async updateGanttItem(
    req: Request<GetGanttItemType, any, UpdateGanttItemType>,
    res: Response
  ) {
    try {
      const { id } = req.params;
      const response = await this.service.updateGanttItem(id, req.body);

      if (response instanceof PrismaError || response instanceof GanttError) {
        logger.error({ function: "GanttController.updateGanttItem", error: response });
        return res.status(400).send(response);
      }

      return res.status(200).send(response);
    } catch (error) {
      logger.error({ function: "GanttController.updateGanttItem", error });
      return res.status(500).send({
        error: "Internal Server Error",
        message: "Error al actualizar item del Gantt",
      });
    }
  }

  /**
   * GET /gantt/items/:id
   * Obtener un item del Gantt por ID
   */
  async getGanttItem(req: Request<GetGanttItemType>, res: Response) {
    try {
      const { id } = req.params;
      const includeRelations = req.query.include !== "false";

      const response = await this.service.getGanttItem(id, includeRelations);

      if (response instanceof PrismaError || response instanceof GanttError) {
        logger.error({ function: "GanttController.getGanttItem", error: response });
        return res.status(404).send(response);
      }

      return res.status(200).send(response);
    } catch (error) {
      logger.error({ function: "GanttController.getGanttItem", error });
      return res.status(500).send({
        error: "Internal Server Error",
        message: "Error al obtener item del Gantt",
      });
    }
  }

  /**
   * GET /gantt/items
   * Listar items del Gantt con filtros y paginación
   */
  async listGanttItems(req: Request, res: Response) {
    try {
      const response = await this.service.listGanttItems(req.query as unknown as ListGanttItemsType);

      if (response instanceof PrismaError || response instanceof GanttError) {
        logger.error({ function: "GanttController.listGanttItems", error: response });
        return res.status(400).send(response);
      }

      return res.status(200).send(response);
    } catch (error) {
      logger.error({ function: "GanttController.listGanttItems", error });
      return res.status(500).send({
        error: "Internal Server Error",
        message: "Error al listar items del Gantt",
      });
    }
  }

  /**
   * GET /gantt/search
   * Búsqueda avanzada de items del Gantt con texto + filtros y paginación
   */
  async searchGanttItems(req: Request, res: Response) {
    try {
      const response = await this.service.searchGanttItems(req.query as unknown as SearchGanttItemsType);

      if (response instanceof PrismaError || response instanceof GanttError) {
        logger.error({ function: "GanttController.searchGanttItems", error: response });
        return res.status(400).send(response);
      }

      return res.status(200).send(response);
    } catch (error) {
      logger.error({ function: "GanttController.searchGanttItems", error });
      return res.status(500).send({
        error: "Internal Server Error",
        message: "Error al buscar items del Gantt",
      });
    }
  }

  /**
   * DELETE /gantt/items/:id
   * Eliminar un item del Gantt (soft delete)
   */
  async deleteGanttItem(req: Request<DeleteGanttItemType>, res: Response) {
    try {
      const { id } = req.params;
      const response = await this.service.deleteGanttItem(id);

      if (response instanceof PrismaError || response instanceof GanttError) {
        logger.error({ function: "GanttController.deleteGanttItem", error: response });
        return res.status(400).send(response);
      }

      return res.status(200).send(response);
    } catch (error) {
      logger.error({ function: "GanttController.deleteGanttItem", error });
      return res.status(500).send({
        error: "Internal Server Error",
        message: "Error al eliminar item del Gantt",
      });
    }
  }

  /**
   * POST /gantt/items/:id/complete
   * Marcar un item como completado
   */
  async completeGanttItem(
    req: Request<GetGanttItemType, any, CompleteGanttItemType["body"]>,
    res: Response
  ) {
    try {
      const { id } = req.params;
      const { actualHours, completedAt } = req.body;

      const response = await this.service.completeGanttItem(
        id,
        actualHours,
        completedAt ? new Date(completedAt) : undefined
      );

      if (response instanceof PrismaError || response instanceof GanttError) {
        logger.error({ function: "GanttController.completeGanttItem", error: response });
        return res.status(400).send(response);
      }

      return res.status(200).send(response);
    } catch (error) {
      logger.error({ function: "GanttController.completeGanttItem", error });
      return res.status(500).send({
        error: "Internal Server Error",
        message: "Error al completar item del Gantt",
      });
    }
  }

  /**
   * PUT /gantt/bulk-update
   * Actualizar múltiples items del Gantt simultáneamente
   */
  async bulkUpdateGanttItems(
    req: Request<any, any, BulkUpdateGanttItemsType>,
    res: Response
  ) {
    try {
      const response = await this.service.bulkUpdateGanttItems(req.body);

      if (response instanceof PrismaError || response instanceof GanttError) {
        logger.error({ function: "GanttController.bulkUpdateGanttItems", error: response });
        return res.status(400).send(response);
      }

      return res.status(200).send(response);
    } catch (error) {
      logger.error({ function: "GanttController.bulkUpdateGanttItems", error });
      return res.status(500).send({
        error: "Internal Server Error",
        message: "Error al actualizar items del Gantt en masa",
      });
    }
  }

  /**
   * POST /gantt/bulk-delete
   * Eliminar múltiples items del Gantt simultáneamente (soft delete)
   */
  async bulkDeleteGanttItems(
    req: Request<any, any, BulkDeleteGanttItemsType>,
    res: Response
  ) {
    try {
      const response = await this.service.bulkDeleteGanttItems(req.body);

      if (response instanceof PrismaError || response instanceof GanttError) {
        logger.error({ function: "GanttController.bulkDeleteGanttItems", error: response });
        return res.status(400).send(response);
      }

      return res.status(200).send(response);
    } catch (error) {
      logger.error({ function: "GanttController.bulkDeleteGanttItems", error });
      return res.status(500).send({
        error: "Internal Server Error",
        message: "Error al eliminar items del Gantt en masa",
      });
    }
  }

  // ============================================================================
  // GANTT DEPENDENCY CONTROLLERS
  // ============================================================================

  /**
   * POST /gantt/dependencies
   * Crear una nueva dependencia
   */
  async createDependency(
    req: Request<any, any, CreateDependencyType>,
    res: Response
  ) {
    try {
      const response = await this.service.createDependency(req.body);

      if (response instanceof PrismaError || response instanceof GanttError) {
        logger.error({ function: "GanttController.createDependency", error: response });
        return res.status(400).send(response);
      }

      return res.status(201).send(response);
    } catch (error) {
      logger.error({ function: "GanttController.createDependency", error });
      return res.status(500).send({
        error: "Internal Server Error",
        message: "Error al crear dependencia",
      });
    }
  }

  /**
   * PUT /gantt/dependencies/:id
   * Actualizar una dependencia
   */
  async updateDependency(
    req: Request<GetDependencyType, any, UpdateDependencyType>,
    res: Response
  ) {
    try {
      const { id } = req.params;
      const response = await this.service.updateDependency(id, req.body);

      if (response instanceof PrismaError || response instanceof GanttError) {
        logger.error({ function: "GanttController.updateDependency", error: response });
        return res.status(400).send(response);
      }

      return res.status(200).send(response);
    } catch (error) {
      logger.error({ function: "GanttController.updateDependency", error });
      return res.status(500).send({
        error: "Internal Server Error",
        message: "Error al actualizar dependencia",
      });
    }
  }

  /**
   * GET /gantt/dependencies/:id
   * Obtener una dependencia por ID
   */
  async getDependency(req: Request<GetDependencyType>, res: Response) {
    try {
      const { id } = req.params;
      const response = await this.service.getDependency(id);

      if (response instanceof PrismaError || response instanceof GanttError) {
        logger.error({ function: "GanttController.getDependency", error: response });
        return res.status(404).send(response);
      }

      return res.status(200).send(response);
    } catch (error) {
      logger.error({ function: "GanttController.getDependency", error });
      return res.status(500).send({
        error: "Internal Server Error",
        message: "Error al obtener dependencia",
      });
    }
  }

  /**
   * GET /gantt/dependencies
   * Listar dependencias con filtros
   */
  async listDependencies(
    req: Request<any, any, any, ListDependenciesType>,
    res: Response
  ) {
    try {
      const response = await this.service.listDependencies(req.query);

      if (response instanceof PrismaError || response instanceof GanttError) {
        logger.error({ function: "GanttController.listDependencies", error: response });
        return res.status(400).send(response);
      }

      return res.status(200).send(response);
    } catch (error) {
      logger.error({ function: "GanttController.listDependencies", error });
      return res.status(500).send({
        error: "Internal Server Error",
        message: "Error al listar dependencias",
      });
    }
  }

  /**
   * DELETE /gantt/dependencies/:id
   * Eliminar una dependencia
   */
  async deleteDependency(req: Request<DeleteDependencyType>, res: Response) {
    try {
      const { id } = req.params;
      const response = await this.service.deleteDependency(id);

      if (response instanceof PrismaError || response instanceof GanttError) {
        logger.error({ function: "GanttController.deleteDependency", error: response });
        return res.status(400).send(response);
      }

      return res.status(200).send(response);
    } catch (error) {
      logger.error({ function: "GanttController.deleteDependency", error });
      return res.status(500).send({
        error: "Internal Server Error",
        message: "Error al eliminar dependencia",
      });
    }
  }

  /**
   * GET /gantt/items/:itemId/dependencies
   * Obtener dependencias de un item (predecessors y successors)
   */
  async getItemDependencies(
    req: Request,
    res: Response
  ) {
    try {
      const { itemId } = req.params;
      const direction = (req.query?.direction as "predecessors" | "successors" | "both" | undefined) || "both";

      const response = await this.service.getItemDependencies(itemId, direction);

      if (response instanceof PrismaError || response instanceof GanttError) {
        logger.error({
          function: "GanttController.getItemDependencies",
          error: response,
        });
        return res.status(404).send(response);
      }

      return res.status(200).send(response);
    } catch (error) {
      logger.error({ function: "GanttController.getItemDependencies", error });
      return res.status(500).send({
        error: "Internal Server Error",
        message: "Error al obtener dependencias del item",
      });
    }
  }
}
