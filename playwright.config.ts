import { defineConfig, devices } from "@playwright/test";

/**
 * Configuración de Playwright para las pruebas end-to-end de Opina.
 * Viewport móvil por defecto (390×844, ~iPhone 12) porque la aplicación
 * es mobile-first (docs/02-arquitectura.md).
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    viewport: { width: 390, height: 844 },
  },
  projects: [
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 5"], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    // Los e2e registran decenas de usuarios desde una misma IP: sin límite de intentos (S-03).
    // `next start` en local corre en modo producción: hay que confiar en el host (S-08).
    env: { RATE_LIMIT_DISABLED: "1", AUTH_TRUST_HOST: "true" },
    timeout: 120_000,
  },
});
