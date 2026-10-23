import { z } from "zod";

/**
 * Esquemas Zod compartidos entre cliente y servidor para identificación de
 * usuarios (TKT-006). Ver docs/03-modelo-datos.md §3.3 (User) y spec
 * `identificacion-usuarios`.
 */

const USERNAME_REGEX = /^[a-z0-9_]+$/;

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "El nombre de usuario debe tener entre 3 y 30 caracteres")
    .max(30, "El nombre de usuario debe tener entre 3 y 30 caracteres")
    .regex(
      USERNAME_REGEX,
      "El nombre de usuario solo puede contener minúsculas, números y guion bajo",
    ),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "El email es obligatorio")
    .email("El email no es válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "El email es obligatorio")
    .email("El email no es válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export type LoginInput = z.infer<typeof loginSchema>;
