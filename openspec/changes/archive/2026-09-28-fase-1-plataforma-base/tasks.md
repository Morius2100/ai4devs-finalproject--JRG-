## 1. Proyecto base (TKT-001)

- [x] 1.1 Crear el proyecto Next.js 15 con App Router, carpeta `src/`, TypeScript `strict` y Tailwind CSS
- [x] 1.2 Configurar ESLint y Prettier y añadir scripts `lint`, `typecheck` y `format`
- [x] 1.3 Configurar Vitest + Testing Library (`test`) con entorno jsdom para componentes y node para servidor
- [x] 1.4 Configurar Playwright (`test:e2e`) con viewport móvil por defecto (390×844)
- [x] 1.5 Crear la estructura de carpetas de `docs/02-arquitectura.md §2.7`

## 2. Entorno local (TKT-002)

- [x] 2.1 Crear `docker-compose.yml` con PostgreSQL 16 (BD `opina` y `opina_test`) y MinIO con bucket `opina-images` de lectura pública
- [x] 2.2 Crear `.env.example` con `DATABASE_URL`, `AUTH_SECRET` y variables `S3_*`
- [x] 2.3 Implementar `src/server/env.ts` que valide las variables con Zod y falle al arrancar si falta alguna

## 3. Base de datos (TKT-003, TKT-004)

- [x] 3.1 Escribir `prisma/schema.prisma` según `docs/03-modelo-datos.md §3.4`
- [x] 3.2 Generar la migración inicial y añadir el SQL manual (pg_trgm, índice trigram, CHECKs)
- [x] 3.3 Crear el cliente Prisma singleton en `src/server/db/client.ts`
- [x] 3.4 Implementar `prisma/seed.ts` idempotente según `docs/03-modelo-datos.md §3.6` (usuarios y amistades; los temas se completan en fases posteriores si hace falta)

## 4. Utilidades comunes de servidor (TKT-005)

- [x] 4.1 Definir errores de dominio en `src/server/errors.ts` (`ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`)
- [x] 4.2 Implementar `toHttpResponse(error)` con el formato `{ error: { code, message } }` y códigos 400/401/403/404/409/413/415/500
- [x] 4.3 Implementar `encodeCursor`/`decodeCursor` (base64url + validación Zod)
- [x] 4.4 Tests unitarios de mapeo de errores y cursores

## 5. Autenticación (TKT-006)

- [x] 5.1 Esquemas Zod `registerSchema` y `loginSchema` en `src/lib/validation/auth.ts`
- [x] 5.2 Implementar `AuthService.register` (normaliza email, hash bcrypt coste 12, `ConflictError` si existe) y `AuthService.verifyCredentials`
- [x] 5.3 Configurar Auth.js v5 (Credentials, sesión JWT con `id` y `username`) en `src/server/auth`
- [x] 5.4 Implementar `POST /api/register` y el helper `requireUser()`

## 6. Interfaz de identificación y layout (TKT-007, TKT-008)

- [x] 6.1 Pantalla `/registro` con validación y errores de campo; inicia sesión tras registrarse y redirige a `/`
- [x] 6.2 Pantalla `/login` con mensaje "Credenciales incorrectas"; redirige a `/`
- [x] 6.3 Layout raíz mobile-first con `MainMenu` que incluye "Cerrar sesión"
- [x] 6.4 `src/middleware.ts`: redirección a `/login` en páginas y `401` en `/api/*` sin sesión, con las excepciones públicas
- [x] 6.5 Página `/` provisional (se sustituye en la fase 2)

## 7. CI (TKT-009)

- [x] 7.1 Workflow de GitHub Actions con servicio PostgreSQL: install, `prisma migrate deploy`, lint, typecheck, test, build, test:e2e

## 8. Pruebas (TKT-010)

- [x] 8.1 Integración de `AuthService` y `POST /api/register`: registro correcto, conflicto, datos inválidos y ausencia de hash en respuestas
- [x] 8.2 E2E: registro correcto, credenciales incorrectas, visitante redirigido a `/login`, `401` en API sin sesión y cierre de sesión
