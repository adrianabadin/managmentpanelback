import { z } from "zod";

/**
 * ENUMS DE PRISMA
 * Replicados como Zod enums para validación
 */

export const PriorityEnum = z.enum(["low", "medium", "high", "critical"], {
  errorMap: () => ({ message: "La prioridad debe ser: low, medium, high o critical" })
});

export const GanttStatusEnum = z.enum(["planning", "active", "onhold", "completed", "cancelled"], {
  errorMap: () => ({ message: "El estado debe ser: planning, active, onhold, completed o cancelled" })
});

export const GanttTypeEnum = z.enum(["task", "milestone", "summary"], {
  errorMap: () => ({ message: "El tipo debe ser: task, milestone o summary" })
});

export const DependencyTypeEnum = z.enum(["endToStart", "startToStart", "endToEnd", "startToEnd"], {
  errorMap: () => ({ message: "El tipo de dependencia debe ser: endToStart, startToStart, endToEnd o startToEnd" })
});

/**
 * VALIDADORES CUSTOM
 */

// Validar que progress esté entre 0 y 100
const progressValidator = z.number()
  .int({ message: "El progreso debe ser un número entero" })
  .min(0, { message: "El progreso no puede ser menor a 0" })
  .max(100, { message: "El progreso no puede ser mayor a 100" });

// Validar UUID
const uuidValidator = z.string().uuid({ message: "Debe ser un UUID válido" });

// Validar fecha ISO
const dateValidator = z.string().datetime({ message: "Debe ser una fecha válida en formato ISO 8601" })
  .or(z.date());

// Validar color hex (opcional)
const colorValidator = z.string()
  .regex(/^#[0-9A-F]{6}$/i, { message: "El color debe estar en formato hexadecimal (#RRGGBB)" })
  .optional();

// Validar horas estimadas/reales (positivo)
const hoursValidator = z.number()
  .positive({ message: "Las horas deben ser un número positivo" })
  .optional();

/**
 * SCHEMAS PARA GANTT ITEM
 */

// Schema base para crear un item
export const CreateGanttItemSchema = z.object({
  body: z.object({
    title: z.string()
      .min(1, { message: "El título es requerido" })
      .max(200, { message: "El título no puede exceder 200 caracteres" }),

    description: z.string()
      .max(2000, { message: "La descripción no puede exceder 2000 caracteres" })
      .optional()
      .default(""),

    startDate: dateValidator,

    endDate: dateValidator,

    progress: progressValidator.optional().default(0),

    priority: PriorityEnum.optional().default("medium"),

    status: GanttStatusEnum.optional().default("planning"),

    type: GanttTypeEnum.optional().default("task"),

    sortOrder: z.number().int().optional().default(0),

    estimatedHours: hoursValidator,

    actualHours: hoursValidator,

    color: colorValidator,

    // Relaciones (opcionales)
    departmentsId: uuidValidator.optional(),
    demographyId: uuidValidator.optional(),
    assignedToId: uuidValidator.optional(),
    parentId: uuidValidator.optional(),

    // createdById es requerido (se extrae del JWT en el controller)
    createdById: uuidValidator
  })
  // Validación custom: startDate debe ser antes de endDate
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return start < end || data.type === "milestone";
    },
    {
      message: "La fecha de inicio debe ser anterior a la fecha de fin (excepto para milestones)",
      path: ["endDate"]
    }
  )
  // Validación custom: milestone debe tener startDate === endDate
  .refine(
    (data) => {
      if (data.type !== "milestone") return true;
      const start = new Date(data.startDate).getTime();
      const end = new Date(data.endDate).getTime();
      return start === end;
    },
    {
      message: "Los milestones deben tener la misma fecha de inicio y fin",
      path: ["endDate"]
    }
  )
  // Validación custom: summary no debe tener assignedTo
  .refine(
    (data) => {
      if (data.type !== "summary") return true;
      return !data.assignedToId;
    },
    {
      message: "Los items de tipo 'summary' no pueden tener un usuario asignado",
      path: ["assignedToId"]
    }
  )
});

// Schema para actualizar un item (todos los campos opcionales excepto id)
export const UpdateGanttItemSchema = z.object({
  params: z.object({
    id: uuidValidator
  }),
  body: z.object({
    title: z.string()
      .min(1, { message: "El título no puede estar vacío" })
      .max(200, { message: "El título no puede exceder 200 caracteres" })
      .optional(),

    description: z.string()
      .max(2000, { message: "La descripción no puede exceder 2000 caracteres" })
      .optional(),

    startDate: dateValidator.optional(),

    endDate: dateValidator.optional(),

    progress: progressValidator.optional(),

    priority: PriorityEnum.optional(),

    status: GanttStatusEnum.optional(),

    type: GanttTypeEnum.optional(),

    sortOrder: z.number().int().optional(),

    estimatedHours: hoursValidator,

    actualHours: hoursValidator,

    color: colorValidator,

    departmentsId: uuidValidator.optional().nullable(),
    demographyId: uuidValidator.optional().nullable(),
    assignedToId: uuidValidator.optional().nullable(),
    parentId: uuidValidator.optional().nullable(),

    isActive: z.boolean().optional()
  })
  // Si se actualizan fechas, validar que startDate < endDate
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return start <= end;
    },
    {
      message: "La fecha de inicio debe ser anterior o igual a la fecha de fin",
      path: ["endDate"]
    }
  )
});

// Schema para obtener un item por ID
export const GetGanttItemSchema = z.object({
  params: z.object({
    id: uuidValidator
  })
});

// Schema para listar items con filtros
export const ListGanttItemsSchema = z.object({
  query: z.object({
    departmentsId: uuidValidator.optional(),
    demographyId: uuidValidator.optional(),
    assignedToId: uuidValidator.optional(),
    createdById: uuidValidator.optional(),
    parentId: uuidValidator.optional(),
    status: GanttStatusEnum.optional(),
    priority: PriorityEnum.optional(),
    type: GanttTypeEnum.optional(),
    isActive: z.enum(["true", "false"]).optional(),

    // Filtros de rango de fechas
    startDateFrom: dateValidator.optional(),
    startDateTo: dateValidator.optional(),
    endDateFrom: dateValidator.optional(),
    endDateTo: dateValidator.optional(),

    // Paginación
    page: z.string()
      .regex(/^\d+$/, { message: "El número de página debe ser un entero positivo" })
      .optional()
      .default("1")
      .transform(Number),

    pageSize: z.string()
      .regex(/^\d+$/, { message: "El tamaño de página debe ser un entero positivo" })
      .optional()
      .default("50")
      .transform(Number),

    // Include related data
    includeChildren: z.enum(["true", "false"]).optional(),
    includeDependencies: z.enum(["true", "false"]).optional()
  }).optional()
});

// Schema para búsqueda avanzada de items
export const SearchGanttItemsSchema = z.object({
  query: z.object({
    // Búsqueda de texto en title y description
    query: z.string()
      .min(1, { message: "La búsqueda debe tener al menos 1 carácter" })
      .max(200, { message: "La búsqueda no puede exceder 200 caracteres" })
      .optional(),

    // Todos los filtros de ListGanttItemsSchema
    departmentsId: uuidValidator.optional(),
    demographyId: uuidValidator.optional(),
    assignedToId: uuidValidator.optional(),
    createdById: uuidValidator.optional(),
    parentId: uuidValidator.optional(),
    status: GanttStatusEnum.optional(),
    priority: PriorityEnum.optional(),
    type: GanttTypeEnum.optional(),
    isActive: z.enum(["true", "false"]).optional(),

    // Filtros de rango de fechas
    startDateFrom: dateValidator.optional(),
    startDateTo: dateValidator.optional(),
    endDateFrom: dateValidator.optional(),
    endDateTo: dateValidator.optional(),

    // Filtros de progreso
    minProgress: z.string()
      .regex(/^\d+$/, { message: "El progreso mínimo debe ser un número entre 0 y 100" })
      .transform(Number)
      .refine((val) => val >= 0 && val <= 100, {
        message: "El progreso mínimo debe estar entre 0 y 100"
      })
      .optional(),

    maxProgress: z.string()
      .regex(/^\d+$/, { message: "El progreso máximo debe ser un número entre 0 y 100" })
      .transform(Number)
      .refine((val) => val >= 0 && val <= 100, {
        message: "El progreso máximo debe estar entre 0 y 100"
      })
      .optional(),

    // Paginación
    page: z.string()
      .regex(/^\d+$/, { message: "El número de página debe ser un entero positivo" })
      .optional()
      .default("1")
      .transform(Number),

    pageSize: z.string()
      .regex(/^\d+$/, { message: "El tamaño de página debe ser un entero positivo" })
      .optional()
      .default("50")
      .transform(Number),

    // Include related data
    includeChildren: z.enum(["true", "false"]).optional(),
    includeDependencies: z.enum(["true", "false"]).optional()
  }).optional()
});

// Schema para eliminar un item (soft delete)
export const DeleteGanttItemSchema = z.object({
  params: z.object({
    id: uuidValidator
  })
});

// Schema para completar un item
export const CompleteGanttItemSchema = z.object({
  params: z.object({
    id: uuidValidator
  }),
  body: z.object({
    actualHours: hoursValidator, // Opcional: registrar horas reales al completar
    completedAt: dateValidator.optional() // Opcional: override de fecha de completion
  })
});

// Schema para actualización masiva de items
export const BulkUpdateGanttItemsSchema = z.object({
  body: z.object({
    ids: z.array(uuidValidator)
      .min(1, { message: "Debe proporcionar al menos un ID" })
      .max(100, { message: "No se pueden actualizar más de 100 items a la vez" }),

    data: z.object({
      title: z.string()
        .min(1, { message: "El título no puede estar vacío" })
        .max(200, { message: "El título no puede exceder 200 caracteres" })
        .optional(),

      description: z.string()
        .max(2000, { message: "La descripción no puede exceder 2000 caracteres" })
        .optional(),

      progress: progressValidator.optional(),
      priority: PriorityEnum.optional(),
      status: GanttStatusEnum.optional(),
      type: GanttTypeEnum.optional(),
      sortOrder: z.number().int().optional(),
      estimatedHours: hoursValidator,
      actualHours: hoursValidator,
      color: colorValidator,

      departmentsId: uuidValidator.optional().nullable(),
      demographyId: uuidValidator.optional().nullable(),
      assignedToId: uuidValidator.optional().nullable(),

      isActive: z.boolean().optional()
    })
    .refine(
      (data) => Object.keys(data).length > 0,
      { message: "Debe proporcionar al menos un campo para actualizar" }
    )
  })
});

// Schema para eliminación masiva de items
export const BulkDeleteGanttItemsSchema = z.object({
  body: z.object({
    ids: z.array(uuidValidator)
      .min(1, { message: "Debe proporcionar al menos un ID" })
      .max(100, { message: "No se pueden eliminar más de 100 items a la vez" })
  })
});

/**
 * SCHEMAS PARA GANTT DEPENDENCY
 */

// Schema para crear una dependencia
export const CreateDependencySchema = z.object({
  body: z.object({
    sourceItemId: uuidValidator,
    targetItemId: uuidValidator,
    type: DependencyTypeEnum.optional().default("endToStart"),
    lagDays: z.number()
      .int({ message: "El lag debe ser un número entero" })
      .optional()
      .default(0)
  })
  // Validación: no permitir dependencia de un item a sí mismo
  .refine(
    (data) => data.sourceItemId !== data.targetItemId,
    {
      message: "Un item no puede depender de sí mismo",
      path: ["targetItemId"]
    }
  )
});

// Schema para actualizar una dependencia
export const UpdateDependencySchema = z.object({
  params: z.object({
    id: uuidValidator
  }),
  body: z.object({
    type: DependencyTypeEnum.optional(),
    lagDays: z.number()
      .int({ message: "El lag debe ser un número entero" })
      .optional()
  })
});

// Schema para obtener una dependencia por ID
export const GetDependencySchema = z.object({
  params: z.object({
    id: uuidValidator
  })
});

// Schema para listar dependencias
export const ListDependenciesSchema = z.object({
  query: z.object({
    sourceItemId: uuidValidator.optional(),
    targetItemId: uuidValidator.optional(),
    type: DependencyTypeEnum.optional()
  }).optional()
});

// Schema para eliminar una dependencia
export const DeleteDependencySchema = z.object({
  params: z.object({
    id: uuidValidator
  })
});

// Schema para obtener dependencias de un item (predecessors y successors)
export const GetItemDependenciesSchema = z.object({
  params: z.object({
    itemId: uuidValidator
  }),
  query: z.object({
    direction: z.enum(["predecessors", "successors", "both"])
      .optional()
      .default("both")
  }).optional()
});

/**
 * TYPES INFERIDOS
 * Exportar types para usar en controllers y services
 *
 * NOTA:
 * - z.input<> = Tipo ANTES de transformaciones (para tests y validación)
 * - z.infer<> = Tipo DESPUÉS de transformaciones (para servicios internos)
 */

// GanttItem types - Input types (antes de transformación, para tests)
export type CreateGanttItemInputType = z.input<typeof CreateGanttItemSchema>["body"];
export type UpdateGanttItemInputType = z.input<typeof UpdateGanttItemSchema>["body"];
export type ListGanttItemsInputType = z.input<typeof ListGanttItemsSchema>["query"];
export type SearchGanttItemsInputType = z.input<typeof SearchGanttItemsSchema>["query"];
export type BulkUpdateGanttItemsInputType = z.input<typeof BulkUpdateGanttItemsSchema>["body"];
export type CompleteGanttItemInputType = z.input<typeof CompleteGanttItemSchema>;

// GanttItem types - Output types (después de transformación, para servicios)
export type CreateGanttItemType = z.infer<typeof CreateGanttItemSchema>["body"];
export type UpdateGanttItemType = z.infer<typeof UpdateGanttItemSchema>["body"];
export type GetGanttItemType = z.infer<typeof GetGanttItemSchema>["params"];
export type ListGanttItemsType = z.infer<typeof ListGanttItemsSchema>["query"];
export type SearchGanttItemsType = z.infer<typeof SearchGanttItemsSchema>["query"];
export type DeleteGanttItemType = z.infer<typeof DeleteGanttItemSchema>["params"];
export type CompleteGanttItemType = z.infer<typeof CompleteGanttItemSchema>;
export type BulkUpdateGanttItemsType = z.infer<typeof BulkUpdateGanttItemsSchema>["body"];
export type BulkDeleteGanttItemsType = z.infer<typeof BulkDeleteGanttItemsSchema>["body"];

// GanttDependency types - Input types (antes de transformación, para tests)
export type CreateDependencyInputType = z.input<typeof CreateDependencySchema>["body"];
export type UpdateDependencyInputType = z.input<typeof UpdateDependencySchema>["body"];
export type ListDependenciesInputType = z.input<typeof ListDependenciesSchema>["query"];
export type GetItemDependenciesInputType = z.input<typeof GetItemDependenciesSchema>;

// GanttDependency types - Output types (después de transformación, para servicios)
export type CreateDependencyType = z.infer<typeof CreateDependencySchema>["body"];
export type UpdateDependencyType = z.infer<typeof UpdateDependencySchema>["body"];
export type GetDependencyType = z.infer<typeof GetDependencySchema>["params"];
export type ListDependenciesType = z.infer<typeof ListDependenciesSchema>["query"];
export type DeleteDependencyType = z.infer<typeof DeleteDependencySchema>["params"];
export type GetItemDependenciesType = z.infer<typeof GetItemDependenciesSchema>;

// Enum types
export type PriorityType = z.infer<typeof PriorityEnum>;
export type GanttStatusType = z.infer<typeof GanttStatusEnum>;
export type GanttTypeType = z.infer<typeof GanttTypeEnum>;
export type DependencyTypeType = z.infer<typeof DependencyTypeEnum>;
