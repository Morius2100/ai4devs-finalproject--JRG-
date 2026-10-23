import path from "node:path";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  // Carga .env.test / .env.test.local (y .env como fallback) para que las
  // pruebas de integración usen la BD `opina_test` (docs/07 §7.1, design.md).
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    test: {
      globals: true,
      // La mayoría de las pruebas (servicios, API, utilidades) corren en Node.
      // Las pruebas de componentes React necesitan un DOM simulado: añaden
      // `// @vitest-environment jsdom` como primera línea del archivo
      // (p. ej. tests/unit/components/**).
      environment: "node",
      setupFiles: ["./tests/setup.ts"],
      // next-auth importa `next/server` sin extensión; Node ESM no lo resuelve fuera de Vite.
      server: { deps: { inline: ["next-auth", "@auth/core"] } },
      include: ["tests/unit/**/*.test.{ts,tsx}", "tests/integration/**/*.test.{ts,tsx}"],
      exclude: ["tests/e2e/**", "node_modules/**", ".next/**"],
      coverage: {
        provider: "v8",
        reporter: ["text", "html"],
        include: ["src/**/*.{ts,tsx}"],
      },
    },
  };
});
