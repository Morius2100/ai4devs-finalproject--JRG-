/**
 * Se ejecuta una vez al arrancar el servidor Next.js (Node.js runtime).
 * Importar `env` fuerza la validación de las variables de entorno
 * (TKT-002): si falta alguna, el arranque falla con un error claro.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("@/server/env");
  }
}
