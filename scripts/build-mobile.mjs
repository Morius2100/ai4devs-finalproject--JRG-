// Build de la app Android (TKT-046): export estático + `cap sync android`.
//   node scripts/build-mobile.mjs --dev   → API en http://localhost:3000 (adb reverse)
//   NEXT_PUBLIC_API_URL=https://… node scripts/build-mobile.mjs
// Next compila en `.next` aunque exporte a `out-mobile`: no lanzar con `next dev` en marcha.
import { spawnSync } from "node:child_process";

const dev = process.argv.includes("--dev");
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? (dev ? "http://localhost:3000" : undefined);

if (!apiUrl) {
  console.error(
    "Falta NEXT_PUBLIC_API_URL (URL HTTPS de la API). Usa --dev para desarrollo por cable.",
  );
  process.exit(1);
}

const env = {
  ...process.env,
  OPINA_TARGET: "mobile",
  NEXT_PUBLIC_API_URL: apiUrl,
  // Solo el build de desarrollo permite elegir el servidor desde la app (TKT-068).
  ...(dev ? { OPINA_MOBILE_ENV: "dev", NEXT_PUBLIC_OPINA_SERVER_CONFIGURABLE: "true" } : {}),
};

for (const command of ["npx next build", "npx cap sync android"]) {
  const result = spawnSync(command, { stdio: "inherit", env, shell: true });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
console.log(`\nApp Android sincronizada con la API ${apiUrl}.`);
