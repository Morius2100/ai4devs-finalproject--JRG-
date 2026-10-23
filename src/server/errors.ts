/**
 * Errores de dominio tipados (TKT-005).
 * Los servicios lanzan estos errores; la capa API los traduce a respuestas
 * HTTP con `toHttpResponse` (src/server/http.ts).
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly status: number;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** 400 — los datos de entrada no cumplen las reglas de validación. */
export class ValidationError extends DomainError {
  readonly code = "VALIDATION_ERROR";
  readonly status = 400;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(message: string, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.fieldErrors = fieldErrors;
  }
}

/** 401 — la petición requiere una sesión iniciada. */
export class UnauthorizedError extends DomainError {
  readonly code = "UNAUTHORIZED";
  readonly status = 401;

  constructor(message = "Es necesario iniciar sesión") {
    super(message);
  }
}

/** 403 — hay sesión, pero el usuario no tiene permiso para esta acción. */
export class ForbiddenError extends DomainError {
  readonly code = "FORBIDDEN";
  readonly status = 403;

  constructor(message = "No tienes permiso para realizar esta acción") {
    super(message);
  }
}

/** 404 — el recurso no existe o no es accesible (no se revela cuál). */
export class NotFoundError extends DomainError {
  readonly code = "NOT_FOUND";
  readonly status = 404;

  constructor(message = "Recurso no encontrado") {
    super(message);
  }
}

/** 409 — la petición entra en conflicto con el estado actual (duplicados, voto ya emitido…). */
export class ConflictError extends DomainError {
  readonly code = "CONFLICT";
  readonly status = 409;

  constructor(message: string) {
    super(message);
  }
}

/** 413 — el contenido enviado excede el tamaño permitido. */
export class PayloadTooLargeError extends DomainError {
  readonly code = "PAYLOAD_TOO_LARGE";
  readonly status = 413;

  constructor(message = "El archivo supera el tamaño máximo permitido") {
    super(message);
  }
}

/** 415 — el tipo de contenido enviado no está soportado. */
export class UnsupportedMediaTypeError extends DomainError {
  readonly code = "UNSUPPORTED_MEDIA_TYPE";
  readonly status = 415;

  constructor(message = "El tipo de archivo no está soportado") {
    super(message);
  }
}
