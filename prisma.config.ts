import path from "node:path";
import "dotenv/config";
import { defineConfig } from "prisma/config";

// Sustituye a package.json#prisma (deprecado desde Prisma 6).
// prisma.config.ts ya no carga .env automáticamente: hay que hacerlo aquí.
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
