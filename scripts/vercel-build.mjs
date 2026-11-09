// Build en Vercel (docs/08-despliegue-vercel.md): Vercel ejecuta `npm run vercel-build`
// en lugar de `build` cuando existe ese script.
//   1. `prisma generate`: Vercel cachea node_modules y el cliente podría quedar desfasado.
//   2. `prisma migrate deploy`: solo en producción (o con RUN_MIGRATIONS=1), para que la
//      vista previa de una rama no migre la base de datos de producción.
//   3. `prisma/seed.ts` (datos de prueba): solo si RUN_SEED=1 y se migra. Es idempotente;
//      activar la variable para un despliegue y quitarla después.
//   4. `next build`.
// Las migraciones van por la conexión directa de Neon (sin pooler): PgBouncer en modo
// transacción no admite los bloqueos de `migrate`. La integración de Neon con Vercel la
// define como DATABASE_URL_UNPOOLED; si se configura a mano, DIRECT_URL.
import { spawnSync } from "node:child_process";
import { seedBlockedReason } from "./seed-guard.mjs";

// Las mismas variables que exige src/server/env.ts. `next build` importa ese módulo al
// recoger los datos de las páginas, así que sin ellas el build falla igualmente; se
// comprueban antes para que el error diga qué entorno y qué rama de Vercel las necesitan.
const REQUIRED_ENV = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "S3_ENDPOINT",
  "S3_REGION",
  "S3_BUCKET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "S3_PUBLIC_URL",
];
const missingEnv = REQUIRED_ENV.filter((name) => !process.env[name]?.trim());
if (missingEnv.length > 0) {
  const target = process.env.VERCEL_ENV ?? "sin definir";
  const branch = process.env.VERCEL_GIT_COMMIT_REF ?? "sin definir";
  console.error(
    [
      `Faltan variables de entorno en este build (VERCEL_ENV=${target}, rama ${branch}):`,
      ...missingEnv.map((name) => `  - ${name}`),
      "En Vercel → Settings → Environment Variables, defínelas para este entorno.",
      'Si es Preview, comprueba que aplican a "All Preview branches" o a esta rama exacta,',
      "y vuelve a desplegar: los cambios de variables solo afectan a los despliegues nuevos.",
      "Guía: docs/08-despliegue-vercel.md §8.5 y §8.9.",
    ].join("\n"),
  );
  process.exit(1);
}

const seedBlocked = seedBlockedReason(process.env);
if (seedBlocked) {
  console.error(seedBlocked);
  process.exit(1);
}

const shouldMigrate = process.env.VERCEL_ENV === "production" || process.env.RUN_MIGRATIONS === "1";
const migrationUrl =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DIRECT_URL ?? process.env.DATABASE_URL;

function run(command, env = process.env) {
  const result = spawnSync(command, { stdio: "inherit", env, shell: true });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("npx prisma generate");

if (shouldMigrate) {
  if (!migrationUrl) {
    console.error("Falta DATABASE_URL (o DATABASE_URL_UNPOOLED / DIRECT_URL) para migrar.");
    process.exit(1);
  }
  const migrationEnv = { ...process.env, DATABASE_URL: migrationUrl };
  run("npx prisma migrate deploy", migrationEnv);
  if (process.env.RUN_SEED === "1") {
    run("npx tsx prisma/seed.ts", migrationEnv);
  }
} else {
  console.log(`Migraciones omitidas (VERCEL_ENV=${process.env.VERCEL_ENV ?? "sin definir"}).`);
}

run("npx next build");
