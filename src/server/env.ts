import { z } from "zod";

/**
 * Validación de las variables de entorno del servidor (TKT-002).
 * Se ejecuta al importar este módulo: si falta o es inválida alguna
 * variable, lanza y detiene el arranque de la aplicación.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatoria"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET es obligatoria"),
  S3_ENDPOINT: z.string().min(1, "S3_ENDPOINT es obligatoria"),
  S3_REGION: z.string().min(1, "S3_REGION es obligatoria"),
  S3_BUCKET: z.string().min(1, "S3_BUCKET es obligatoria"),
  S3_ACCESS_KEY_ID: z.string().min(1, "S3_ACCESS_KEY_ID es obligatoria"),
  S3_SECRET_ACCESS_KEY: z.string().min(1, "S3_SECRET_ACCESS_KEY es obligatoria"),
  S3_PUBLIC_URL: z.string().min(1, "S3_PUBLIC_URL es obligatoria"),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(
      (issue) => `- ${issue.path.join(".")}: ${issue.message}`,
    );
    throw new Error(`Variables de entorno inválidas o ausentes:\n${issues.join("\n")}`);
  }
  return parsed.data;
}

export const env = loadEnv();
