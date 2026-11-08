// Configuración global de Vitest: matchers adicionales de Testing Library
// (jest-dom) para las pruebas de componentes que corren en entorno jsdom.
import "@testing-library/jest-dom/vitest";

// Sin límite de intentos por defecto: las pruebas de integración llaman a registro y
// login desde la misma «IP» en cada ejecución y el contador (ventana de una hora) se
// acumula entre ejecuciones. `tests/integration/rate-limit.test.ts` lo reactiva.
process.env.RATE_LIMIT_DISABLED ??= "1";
