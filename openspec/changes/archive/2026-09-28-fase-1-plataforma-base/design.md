## Context

Proyecto nuevo sin código. La arquitectura objetivo es un monolito Next.js con capas presentación → API → servicios → Prisma (`docs/02-arquitectura.md`). Este cambio deja preparadas todas las capas y la identificación de usuarios para que las fases 2–6 solo añadan funcionalidad de producto.

## Goals / Non-Goals

**Goals:**

- Proyecto ejecutable en local con un solo comando de infraestructura (`docker compose up -d`).
- Modelo de datos completo migrado desde el inicio para evitar migraciones encadenadas por fase.
- Registro, login y logout funcionales; todas las rutas protegidas.
- CI que ejecute lint, typecheck, tests y build.

**Non-Goals:**

- Perfiles de usuario, recuperación de contraseña, verificación de email, OAuth (no especificados).
- Gestión de amistades (cuestión abierta Q-01); solo se crean por seed.
- Cualquier pantalla de temas (fases 2–6).

## Decisions

- **Auth.js v5 con Credentials y sesión JWT** en lugar de sesiones en BD: no requiere tablas extra de Auth.js y basta para identificar al usuario. El JWT incluye `id` y `username`.
- **bcryptjs (coste 12)** para el hash; implementación JS pura, sin compilación nativa en Windows/CI.
- **Migración única con SQL manual** para `pg_trgm`, índice trigram y CHECKs, ya que Prisma no los expresa en el esquema.
- **Errores de dominio tipados + `toHttpResponse`**: los Route Handlers quedan en `try { … } catch (e) { return toHttpResponse(e) }`, garantizando el formato `{ error: { code, message } }`.
- **Cursor opaco** = base64url de `JSON.stringify([...clavesDeOrden, id])`; se valida con Zod al decodificar (cursor inválido → `400`).
- **Middleware**: rutas públicas `/login`, `/registro`, `/api/register`, `/api/auth/*` y assets; el resto requiere sesión. Páginas → redirección a `/login`; API → `401` JSON.
- **Mensaje de login genérico** ("Credenciales incorrectas") para no revelar qué emails existen.

## Risks / Trade-offs

- [JWT no revocable antes de expirar] → Caducidad de sesión de 30 días; aceptable para el alcance (no hay gestión de cuenta).
- [Crear todas las tablas en la fase 1 adelanta decisiones de modelo] → El modelo está completamente definido en `docs/03-modelo-datos.md`; los cambios futuros irían en migraciones nuevas.
- [Tests de integración requieren PostgreSQL] → Servicio PostgreSQL en CI y BD `opina_test` en local, reseteada con `prisma migrate reset --force` antes de la suite.
