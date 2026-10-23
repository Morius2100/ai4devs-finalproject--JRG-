import { z } from "zod";

/**
 * `POST /api/topics` (TKT-025): título obligatorio de 3 a 120 caracteres
 * tras `trim`, visibilidad obligatoria. La imagen (opcional) se valida
 * aparte, por _magic bytes_, en `src/server/storage`.
 */
export const createTopicSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "El título debe tener entre 3 y 120 caracteres")
    .max(120, "El título debe tener entre 3 y 120 caracteres"),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
});

export type CreateTopicInput = z.infer<typeof createTopicSchema>;
