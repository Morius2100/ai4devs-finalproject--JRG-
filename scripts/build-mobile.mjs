// Build de la app Android (TKT-046): export estático + `cap sync android`.
//   node scripts/build-mobile.mjs --dev   → API en http://localhost:3000 (adb reverse)
//   node scripts/build-mobile.mjs         → API en el servidor de Vercel (default-server.ts)
//   NEXT_PUBLIC_API_URL=https://… node scripts/build-mobile.mjs   → otro servidor
// Next compila en `.next` aunque exporte a `out-mobile`: no lanzar con `next dev` en marcha.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const dev = process.argv.includes("--dev");

/** Servidor por defecto del APK de producción: se lee de `default-server.ts` (una sola fuente). */
function readDefaultServerUrl() {
  const source = readFileSync(
    new URL("../src/lib/platform/default-server.ts", import.meta.url),
    "utf8",
  );
  const match = source.match(/^export const DEFAULT_SERVER_URL = "([^"]+)";$/m);
  if (!match) {
    console.error("No se encuentra DEFAULT_SERVER_URL en src/lib/platform/default-server.ts.");
    process.exit(1);
  }
  return match[1];
}

const explicitUrl = process.env.NEXT_PUBLIC_API_URL;
const usesDefault = !explicitUrl && !dev;
const apiUrl = explicitUrl || (dev ? "http://localhost:3000" : readDefaultServerUrl());

// El APK de producción bloquea el HTTP sin cifrar: con otra dirección se quedaría en «Sin conexión».
if (!dev && !apiUrl.startsWith("https://")) {
  console.error(`NEXT_PUBLIC_API_URL debe ser una URL HTTPS en el APK de producción (${apiUrl}).`);
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
console.log(
  `\nApp Android sincronizada con la API ${apiUrl}${usesDefault ? " (servidor por defecto)" : ""}.`,
);
