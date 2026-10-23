## Why

Todas las funcionalidades de Opina dependen de saber quién es el usuario: el voto es único por usuario, las opiniones se atribuyen a un usuario, los temas tienen creador y los temas privados dependen de su lista de amigos. Antes de construir cualquier pantalla de producto hace falta el proyecto base, la base de datos con el modelo completo y la identificación mínima de usuarios (supuesto S-01 de `docs/01-producto.md`).

## What Changes

- Creación del proyecto Next.js + TypeScript con Tailwind, ESLint, Prettier, Vitest y Playwright (TKT-001).
- Entorno local con Docker Compose (PostgreSQL + MinIO) y validación de variables de entorno (TKT-002).
- Esquema Prisma completo (User, Friendship, Topic, Vote, Notification), migración inicial e índices (TKT-003).
- Datos semilla para desarrollo y pruebas (TKT-004).
- Utilidades comunes de servidor: errores de dominio, mapeo HTTP, cursores, `requireUser` (TKT-005).
- Registro, inicio y cierre de sesión con Auth.js Credentials (TKT-006, TKT-007).
- Layout global con menú principal y protección de rutas (TKT-008).
- Pipeline de CI (TKT-009) y pruebas (TKT-010).

## Capabilities

### New Capabilities

- `identificacion-usuarios`: registro, inicio de sesión, cierre de sesión y protección de las pantallas y la API para usuarios sin sesión (HU-00).

### Modified Capabilities

<!-- Ninguna: es el primer cambio del proyecto. -->

## Impact

- Crea la estructura completa del repositorio descrita en `docs/02-arquitectura.md §2.7`.
- Introduce las dependencias del stack (`docs/06-stack.md`).
- Crea todas las tablas del modelo de datos (`docs/03-modelo-datos.md`), aunque las fases posteriores son las que las usan.
