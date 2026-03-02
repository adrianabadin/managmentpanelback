/**
 * GANTT MODULE - ERROR CLASSES
 *
 * Códigos de error: GANTT01 - GANTT99
 */

export abstract class GanttError extends Error {
  public text: string;

  constructor(
    public errorContent?: any,
    message: string = "Gantt Error",
    public code: string = "GANTT00"
  ) {
    super(message);
    this.name = "Gantt Error";
    this.text = message;
  }
}

/**
 * ERRORES DE GANTT ITEM
 */

export class GanttItemNotFound extends GanttError {
  constructor(
    errorContent?: any,
    message: string = "El item del Gantt no existe",
    code: string = "GANTT01"
  ) {
    super(errorContent, message, code);
  }
}

export class InvalidDateRange extends GanttError {
  constructor(
    errorContent?: any,
    message: string = "La fecha de inicio debe ser anterior a la fecha de fin",
    code: string = "GANTT02"
  ) {
    super(errorContent, message, code);
  }
}

export class InvalidProgress extends GanttError {
  constructor(
    errorContent?: any,
    message: string = "El progreso debe estar entre 0 y 100",
    code: string = "GANTT03"
  ) {
    super(errorContent, message, code);
  }
}

export class MilestoneInvalidDates extends GanttError {
  constructor(
    errorContent?: any,
    message: string = "Los milestones deben tener la misma fecha de inicio y fin",
    code: string = "GANTT04"
  ) {
    super(errorContent, message, code);
  }
}

export class SummaryCannotHaveAssignee extends GanttError {
  constructor(
    errorContent?: any,
    message: string = "Los items de tipo 'summary' no pueden tener un usuario asignado",
    code: string = "GANTT05"
  ) {
    super(errorContent, message, code);
  }
}

export class InvalidParentReference extends GanttError {
  constructor(
    errorContent?: any,
    message: string = "Referencia al padre inválida o no existe",
    code: string = "GANTT06"
  ) {
    super(errorContent, message, code);
  }
}

export class CircularHierarchy extends GanttError {
  constructor(
    errorContent?: any,
    message: string = "Jerarquía circular detectada: un item no puede ser padre de sí mismo o de sus ancestros",
    code: string = "GANTT07"
  ) {
    super(errorContent, message, code);
  }
}

export class MaxDepthExceeded extends GanttError {
  constructor(
    errorContent?: any,
    message: string = "Se excedió la profundidad máxima de jerarquía permitida (10 niveles)",
    code: string = "GANTT08"
  ) {
    super(errorContent, message, code);
  }
}

export class CannotDeleteItemWithChildren extends GanttError {
  constructor(
    errorContent?: any,
    message: string = "No se puede eliminar un item que tiene hijos. Elimine o reasigne los hijos primero",
    code: string = "GANTT09"
  ) {
    super(errorContent, message, code);
  }
}

export class InvalidMaterializedPath extends GanttError {
  constructor(
    errorContent?: any,
    message: string = "La ruta materializada (path) es inválida o está corrupta",
    code: string = "GANTT10"
  ) {
    super(errorContent, message, code);
  }
}

/**
 * ERRORES DE DEPENDENCIAS
 */

export class DependencyNotFound extends GanttError {
  constructor(
    errorContent?: any,
    message: string = "La dependencia no existe",
    code: string = "GANTT20"
  ) {
    super(errorContent, message, code);
  }
}

export class CircularDependency extends GanttError {
  constructor(
    errorContent?: any,
    message: string = "Dependencia circular detectada: esta dependencia crearía un ciclo en el grafo",
    code: string = "GANTT21"
  ) {
    super(errorContent, message, code);
  }
}

export class SelfDependency extends GanttError {
  constructor(
    errorContent?: any,
    message: string = "Un item no puede depender de sí mismo",
    code: string = "GANTT22"
  ) {
    super(errorContent, message, code);
  }
}

export class DuplicateDependency extends GanttError {
  constructor(
    errorContent?: any,
    message: string = "Esta dependencia ya existe entre estos items",
    code: string = "GANTT23"
  ) {
    super(errorContent, message, code);
  }
}

export class InvalidDependencyType extends GanttError {
  constructor(
    errorContent?: any,
    message: string = "Tipo de dependencia inválido. Debe ser: endToStart, startToStart, endToEnd o startToEnd",
    code: string = "GANTT24"
  ) {
    super(errorContent, message, code);
  }
}

export class DependencyItemNotFound extends GanttError {
  constructor(
    errorContent?: any,
    message: string = "Uno o ambos items de la dependencia no existen",
    code: string = "GANTT25"
  ) {
    super(errorContent, message, code);
  }
}

/**
 * ERRORES DE PERMISOS
 */

export class UnauthorizedGanttAccess extends GanttError {
  constructor(
    errorContent?: any,
    message: string = "No tienes permisos para acceder a este item del Gantt",
    code: string = "GANTT30"
  ) {
    super(errorContent, message, code);
  }
}

export class UnauthorizedGanttModification extends GanttError {
  constructor(
    errorContent?: any,
    message: string = "No tienes permisos para modificar este item del Gantt",
    code: string = "GANTT31"
  ) {
    super(errorContent, message, code);
  }
}

export class UnauthorizedGanttDeletion extends GanttError {
  constructor(
    errorContent?: any,
    message: string = "No tienes permisos para eliminar este item del Gantt",
    code: string = "GANTT32"
  ) {
    super(errorContent, message, code);
  }
}

/**
 * ERRORES DE VALIDACIÓN DE NEGOCIO
 */

export class InvalidStatusTransition extends GanttError {
  constructor(
    errorContent?: any,
    message: string = "Transición de estado inválida",
    code: string = "GANTT40"
  ) {
    super(errorContent, message, code);
  }
}

export class CannotCompleteWithPendingDependencies extends GanttError {
  constructor(
    errorContent?: any,
    message: string = "No se puede completar el item mientras tenga dependencias pendientes",
    code: string = "GANTT41"
  ) {
    super(errorContent, message, code);
  }
}

export class CannotStartWithUnmetDependencies extends GanttError {
  constructor(
    errorContent?: any,
    message: string = "No se puede iniciar el item mientras sus dependencias no estén completadas",
    code: string = "GANTT42"
  ) {
    super(errorContent, message, code);
  }
}

export class InvalidDepartmentReference extends GanttError {
  constructor(
    errorContent?: any,
    message: string = "El departamento especificado no existe",
    code: string = "GANTT43"
  ) {
    super(errorContent, message, code);
  }
}

export class InvalidDemographyReference extends GanttError {
  constructor(
    errorContent?: any,
    message: string = "El estado/demografía especificado no existe",
    code: string = "GANTT44"
  ) {
    super(errorContent, message, code);
  }
}

export class InvalidUserReference extends GanttError {
  constructor(
    errorContent?: any,
    message: string = "El usuario especificado no existe",
    code: string = "GANTT45"
  ) {
    super(errorContent, message, code);
  }
}

/**
 * ERRORES DE OPERACIONES BULK
 */

export class BulkItemsNotFound extends GanttError {
  constructor(
    errorContent?: any,
    message: string = "Algunos items no fueron encontrados",
    code: string = "GANTT50"
  ) {
    super(errorContent, message, code);
  }
}

export class BulkItemsWithChildren extends GanttError {
  constructor(
    errorContent?: any,
    message: string = "Algunos items no pueden ser eliminados porque tienen hijos activos",
    code: string = "GANTT51"
  ) {
    super(errorContent, message, code);
  }
}

/**
 * ERRORES GENERALES
 */

export class GanttDatabaseError extends GanttError {
  constructor(
    errorContent?: any,
    message: string = "Error de base de datos en módulo Gantt",
    code: string = "GANTT90"
  ) {
    super(errorContent, message, code);
  }
}

export class GanttInternalError extends GanttError {
  constructor(
    errorContent?: any,
    message: string = "Error interno en módulo Gantt",
    code: string = "GANTT99"
  ) {
    super(errorContent, message, code);
  }
}
