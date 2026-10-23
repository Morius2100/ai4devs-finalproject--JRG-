import { z } from "zod";

/**
 * Query de `GET /api/topics` (TKT-012). Sin `q` (o vacío tras `trim`) →
 * tendencias; con `q` → búsqueda (docs/02-arquitectura.md §2.5).
 */
export const listTopicsQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(100, "La búsqueda no puede superar los 100 caracteres")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  cursor: z.string().min(1).max(2000).optional(),
});

export type ListTopicsQuery = z.infer<typeof listTopicsQuerySchema>;
