import { z } from "zod";

// ========== SCHEMAS DE VALIDACIÓN ==========

/**
 * Schema de validación para el endpoint createStructuredDocument
 * Valida la estructura del reporte que incluye:
 * - Metadata (fecha, autor, departamento)
 * - Estadísticas agregadas
 * - Demographies con items y referencias a imágenes
 */
export const StructuredDocumentRequestSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  users: z.array(z.string().email()).min(0, "Debe ser un array de emails"), // Permitir array vacío
  content: z.object({
    metadata: z.object({
      generatedAt: z.string(), // ISO datetime o formato local
      generatedBy: z.string(),
      department: z.string(),
      state: z.string().optional()
    }),
    statistics: z.object({
      total: z.number().int().min(0),
      completed: z.number().int().min(0),
      inProgress: z.number().int().min(0),
      pending: z.number().int().min(0)
    }),
    demographies: z.array(
      z.object({
        name: z.string(),
        hasItems: z.boolean().optional(), // Indica si hay items (true) o está vacío (false)
        items: z.array(
          z.object({
            title: z.string(),
            startDate: z.string(), // Formato: DD/MM/YYYY
            endDate: z.string(),
            progress: z.number().min(0).max(100),
            assignedTo: z.string(),
            priority: z.string(),
            type: z.string()
          })
        ),
        images: z.object({
          quarter1Id: z.string().optional(),
          quarter2Id: z.string().optional(),
          quarter3Id: z.string().optional(),
          quarter4Id: z.string().optional()
        }).optional(),
        emptyMessage: z.string().optional() // Mensaje cuando no hay items
      })
    )
  })
});

// ========== TYPES INFERIDOS ==========

/**
 * Tipo TypeScript inferido del schema de validación
 */
export type StructuredDocumentRequest = z.infer<typeof StructuredDocumentRequestSchema>;

/**
 * Response del endpoint createStructuredDocument
 */
export interface CreateStructuredDocumentResponse {
  id: string; // documentId de Google Docs
}

/**
 * Estructura interna para construir requests de batchUpdate
 */
export interface BatchUpdateRequest {
  requests: any[]; // Array de requests para Google Docs API
}

/**
 * Metadata de una tabla generada en el documento
 */
export interface TableMetadata {
  startIndex: number;
  endIndex: number;
  rows: number;
  columns: number;
}
