import { Request, Response } from "express";
import { GoogleServiceExtended } from "./google.service.extended";
import { StructuredDocumentRequest } from "./google.interfaces";
import { logger } from "../Global.Services/logger";
import { GoogleError } from "./google.errors";

/**
 * Controller extendido para Google APIs con endpoints avanzados
 *
 * Extiende la funcionalidad del GoogleController base para agregar
 * endpoints de generación de reportes estructurados con tablas.
 */
export class GoogleControllerExtended {
  constructor(protected googleService = new GoogleServiceExtended()) {
    this.createStructuredDocument = this.createStructuredDocument.bind(this);
  }

  /**
   * POST /google/createStructuredDocument
   *
   * Endpoint para crear un documento Google Docs estructurado con:
   * - Metadata (fecha, autor, departamento)
   * - Estadísticas resumen
   * - Tablas reales por demography
   * - Links a imágenes en Drive
   * - Compartido con múltiples usuarios
   *
   * @param req.body - StructuredDocumentRequest validado por Zod middleware
   * @returns 200: { id: documentId } | 500: GoogleError
   *
   * Ejemplo de request body:
   * {
   *   "title": "Reporte de Proyectos - Salud Pública",
   *   "users": ["user1@example.com", "director@example.com"],
   *   "content": {
   *     "metadata": { ... },
   *     "statistics": { total: 23, completed: 8, ... },
   *     "demographies": [...]
   *   }
   * }
   */
  async createStructuredDocument(
    req: Request<any, any, StructuredDocumentRequest>,
    res: Response
  ) {
    try {
      console.log("🚀 Iniciando creación de documento estructurado...");
      console.log(`📊 Título: ${req.body.title}`);
      console.log(`👥 Compartir con: ${req.body.users.length} usuario(s)`);

      const response = await this.googleService.createStructuredDocumentWithTablesAndPrivateImages(req.body);

      if (response instanceof GoogleError) {
        console.error("❌ Error al crear documento:", response);
        return res.status(500).json({
          error: "Error al crear el documento en Google Docs",
          details: response.message || response.ErrorContent
        });
      }

      console.log(`✅ Documento creado exitosamente: ${response}`);

      return res.status(200).json({
        id: response,
        url: `https://docs.google.com/document/d/${response}/edit`
      });
    } catch (error: any) {
      logger.error({
        function: "GoogleControllerExtended.createStructuredDocument",
        error: error.message || error
      });

      return res.status(500).json({
        error: "Internal server error",
        message: error.message || "Error desconocido al crear el documento"
      });
    }
  }
}
