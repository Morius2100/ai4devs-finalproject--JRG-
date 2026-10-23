import type { z } from "zod";
import { ValidationError } from "@/server/errors";

/**
 * Cursor opaco de paginación keyset (TKT-005).
 * Codifica el array de claves de orden (+ id) como base64url de su JSON.
 * Ver docs/07-desglose-tareas-sdd.md y design.md de fase-1-plataforma-base.
 */
export function encodeCursor(values: readonly unknown[]): string {
  const json = JSON.stringify(values);
  return Buffer.from(json, "utf8").toString("base64url");
}

/**
 * Decodifica y valida un cursor con el esquema Zod de sus claves de orden.
 * Un cursor ausente, corrupto o que no cumple el esquema se rechaza como
 * `ValidationError` (400), nunca como un error interno.
 */
export function decodeCursor<T extends z.ZodTypeAny>(cursor: string, schema: T): z.infer<T> {
  let json: string;
  try {
    json = Buffer.from(cursor, "base64url").toString("utf8");
  } catch {
    throw new ValidationError("Cursor inválido");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new ValidationError("Cursor inválido");
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new ValidationError("Cursor inválido");
  }
  return result.data;
}
