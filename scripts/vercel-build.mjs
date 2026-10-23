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
