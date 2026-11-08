import { NextResponse } from "next/server";
import { DomainError, RateLimitedError, ValidationError } from "@/server/errors";

export type ErrorBody = {
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
};

/**
 * Traduce un error de dominio (o cualquier otro) a una respuesta HTTP con el
 * formato estándar `{ error: { code, message } }` (TKT-005).
 * Los errores no reconocidos se tratan como 500 y no exponen su mensaje interno.
 */
export function toHttpResponse(error: unknown): NextResponse<ErrorBody> {
  if (error instanceof DomainError) {
    const body: ErrorBody = { error: { code: error.code, message: error.message } };
    if (error instanceof ValidationError && error.fieldErrors) {
      body.error.fieldErrors = error.fieldErrors;
    }
    const headers =
      error instanceof RateLimitedError
        ? { "Retry-After": String(error.retryAfterSeconds) }
        : undefined;
    return NextResponse.json(body, { status: error.status, headers });
  }

  console.error(error);
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor" } },
    { status: 500 },
  );
}
