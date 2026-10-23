import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import { defineConfig, globalIgnores } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// `eslint-config-next` todavía distribuye configuración en formato legacy
// (`extends`); FlatCompat la traduce a la configuración plana de ESLint 9.
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = defineConfig([
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  eslintConfigPrettier,
  globalIgnores([
    ".next/**",
    "out/**",
    // Export de la app y proyecto nativo de Capacitor (código generado).
    "out-mobile/**",
    "android/**",
    "build/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
    "coverage/**",
    "prisma/migrations/**",
    // Scripts de herramientas de Claude Code, no código de la aplicación.
    ".claude/**",
  ]),
]);

export default eslintConfig;
