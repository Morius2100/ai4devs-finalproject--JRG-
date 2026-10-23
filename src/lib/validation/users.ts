import { z } from "zod";

/**
 * Query de `GET /api/users` (TKT-034). Sin `q` (o vacío tras `trim`) → lista
 * completa; con `q` → filtro por nombre de usuario.
 */
export const listUsersQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(100, "La búsqueda no puede superar los 100 caracteres")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  cursor: z.string().min(1).max(2000).optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export const TOPIC_SORTS = ["recent", "top"] as const;
export type TopicSort = (typeof TOPIC_SORTS)[number];

/** Query de `GET /api/users/:id/topics` (TKT-035): orden y cursor. */
export const userTopicsQuerySchema = z.object({
  sort: z.enum(TOPIC_SORTS).default("recent"),
  cursor: z.string().min(1).max(2000).optional(),
});

export type UserTopicsQuery = z.infer<typeof userTopicsQuerySchema>;

export const BIO_MAX_LENGTH = 160;

/**
 * Campos de texto de `PATCH /api/me` (TKT-061): `bio` recortada y de hasta
 * 160 caracteres (vacía → se elimina); `removeAvatar` solo con `"true"`.
 * La foto (`avatar`) se valida aparte, por _magic bytes_, en `src/server/storage`.
 */
export const updateProfileSchema = z.object({
  bio: z
    .string()
    .trim()
    .max(BIO_MAX_LENGTH, `La descripción no puede superar los ${BIO_MAX_LENGTH} caracteres`)
    .transform((value) => (value === "" ? null : value))
    .optional(),
  removeAvatar: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** Identificador de usuario de la URL: un UUID (si no, se trata como inexistente). */
export const userIdSchema = z.string().uuid();
