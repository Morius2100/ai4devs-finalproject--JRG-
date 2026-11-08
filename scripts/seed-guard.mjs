// Protección del seed de desarrollo (S-02, spec `confidencialidad-usuarios`).
// El seed crea usuarios con contraseña conocida (`ana`, `bruno`, `carla`, `dani`…):
// en producción solo debe cargarse con una confirmación explícita.

/**
 * Devuelve el motivo por el que NO se debe ejecutar el seed en este entorno, o
 * `null` si puede ejecutarse. `env` es `process.env` (o un objeto de pruebas).
 */
export function seedBlockedReason(env) {
  if (env.RUN_SEED !== "1") {
    return null;
  }
  if (env.VERCEL_ENV === "production" && env.ALLOW_PRODUCTION_SEED !== "1") {
    return (
      "RUN_SEED=1 en producción cargaría usuarios de prueba con una contraseña conocida " +
      "(ana, bruno, carla, dani…). Quita RUN_SEED o confirma con ALLOW_PRODUCTION_SEED=1 " +
      "y define SEED_PASSWORD."
    );
  }
  return null;
}
