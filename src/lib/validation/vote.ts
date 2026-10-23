import { z } from "zod";

/**
 * `POST /api/topics/:id/votes` (TKT-019). La justificación se recorta;
 * vacía o solo espacios → `null` (no es una opinión); máximo 500
 * caracteres tras recortar (design.md de fase-4-votacion-opiniones).
 */
export const castVoteSchema = z.object({
  value: z.enum(["UP", "DOWN"]),
  justification: z
    .string()
    .optional()
    .default("")
    .transform((value) => value.trim())
    .transform((value) => (value.length === 0 ? null : value))
    .refine((value) => value === null || value.length <= 500, {
      message: "La justificación no puede superar los 500 caracteres",
    }),
});

export type CastVoteInput = z.infer<typeof castVoteSchema>;
