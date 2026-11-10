@AGENTS.md

# Opina

Aplicación web _mobile-first_ (con app Android) en la que cada **tema** se vota con un pulgar verde o rojo y una justificación opcional. Tras votar se ven los totales y las opiniones de los demás, coloreadas según su voto. Los temas son **públicos** o **privados** (solo para el creador y sus amigos, que reciben una notificación). Un voto por usuario y tema, no modificable.

Fuente de verdad del producto y del diseño: [`docs/`](docs/README.md) (producto, arquitectura, modelo de datos, historias, tickets, stack, despliegue y [revisión de seguridad](docs/09-revision-seguridad.md)). Plan por cambios con OpenSpec en [`openspec/`](openspec/). **No añadas funcionalidades que no estén en `docs/01-producto.md`.** Idioma: código e identificadores en inglés; textos de interfaz y documentación en español.

## Stack

Detalle y justificación en [`docs/06-stack.md`](docs/06-stack.md).

- **TypeScript** (`strict`) sobre **Node.js 22**.
- **Next.js 15** (App Router, Route Handlers, Middleware) con **React 19** y **Tailwind CSS 4**. Lee `node_modules/next/dist/docs/` antes de tocar APIs de Next (ver `AGENTS.md`).
- **PostgreSQL 16** (extensión `pg_trgm`) con **Prisma 6** (esquema y migraciones en `prisma/`).
- **Auth.js v5** (proveedor Credentials, sesión JWT) y **bcryptjs**. La app Android usa un token `Authorization: Bearer`.
- **Zod** para validar entradas, con esquemas compartidos entre cliente y servidor.
- **TanStack Query 5** en el cliente (`useInfiniteQuery` para el scroll infinito).
- Imágenes: almacenamiento S3-compatible (`@aws-sdk/client-s3`, MinIO en local, Cloudflare R2 en producción) y `file-type` para comprobar el tipo real.
- **Capacitor 8** para la app Android: export estático de la misma interfaz (`OPINA_TARGET=mobile`).
- Pruebas: **Vitest** + Testing Library y **Playwright**. Calidad: ESLint y Prettier. Local: Docker Compose (PostgreSQL + MinIO). CI: GitHub Actions. Despliegue: Vercel + Neon.

## Capas

Monolito modular. Cada capa solo depende de la inferior:

```
src/app/              Presentación y API: páginas y Route Handlers (src/app/api/**), middleware
src/components/       Componentes de UI (Client Components) y src/lib/ (cliente API, validación Zod, plataforma)
src/server/services/  Dominio: la lógica de negocio y las reglas (un servicio por área)
src/server/db/        Acceso a datos: Prisma Client (un singleton)
```

- **Route Handlers** (`src/app/api/**/route.ts`): validan la entrada con Zod, obtienen el usuario con `requireUser()`, **delegan en un servicio** y devuelven el resultado. Convierten los errores con `toHttpResponse` (`src/server/http.ts`). No contienen reglas de negocio ni consultas.
- **Servicios** (`src/server/services/`): `AuthService`, `TopicService`, `StoryService`, `VisibilityPolicy`, `VoteService`, `FriendshipService`, `UserService`, `NotificationService`. Lanzan errores de dominio tipados (`src/server/errors.ts`).
- **Código de servidor** (`src/server/**`): nunca se importa desde componentes cliente. Los componentes obtienen los datos por la API (`src/lib/api/*`) para que la misma interfaz sirva a la web y a la app Android.
- **Transversal**: `src/server/rate-limit.ts` (límite de intentos), `src/server/media.ts` (URLs de imágenes y firmas), `src/server/storage/` (`ImageStorage`).
- **Errores**: `404` para lo inexistente **y** para lo inaccesible (un tema privado ajeno no revela que existe); `409` para el voto repetido; `429` con `Retry-After` al superar el límite de intentos.

## Política de visibilidad (única)

`VisibilityPolicy` (`src/server/services/visibility-policy.ts`) es **el único punto que decide si alguien puede acceder a un tema**:

- **Público** → accesible para todos.
- **Privado** → solo su creador o un amigo del creador (amistad **aceptada**, tabla `friendships`).

Reglas:

- Todo acceso a un tema individual (detalle, voto, opiniones, historias, perfil de un autor) pasa por `VisibilityPolicy`. Usa `canAccessAsync` desde los servicios; `canAccess` es el núcleo puro para tests. No repitas la regla en otro sitio.
- Los listados de tendencias y la búsqueda muestran **solo temas públicos** (filtro `visibility = 'PUBLIC'` en `TopicService`); un tema privado se abre desde la notificación, el perfil del creador o la URL, y solo si la política lo permite.
- Un tema inaccesible responde siempre `404`, nunca `403`.
- La amistad exige **consentimiento**: `FriendshipService.request` solo crea una solicitud pendiente (`friend_requests`) y la amistad nace en `accept`. Una solicitud pendiente no da acceso. `FriendshipService.add` existe solo para semillas y pruebas; **las rutas de la API no deben llamarla**.
- Las imágenes de temas privados se sirven con URL firmada de corta duración (`src/server/media.ts`); no devuelvas la ruta sin firmar.

## Los votos

**Solo `VoteService` escribe votos** (`src/server/services/vote-service.ts`). Ningún otro servicio, ruta ni componente crea, modifica o borra filas de `votes` ni toca los contadores de `topics` (`positiveVotes`, `negativeVotes`, `totalVotes`).

- `VoteService.castVote` hace todo en **una transacción**: comprueba el acceso con `VisibilityPolicy`, inserta el voto y actualiza los tres contadores desnormalizados.
- El **voto único** lo garantiza la base de datos (`UNIQUE (topic_id, user_id)`), también con peticiones concurrentes; un segundo intento da `ConflictError` (`409`). Los votos no se editan ni se retiran.
- La justificación es opcional: se recorta, una cadena vacía pasa a `null` y admite hasta 500 caracteres.
- Los totales y las opiniones solo se devuelven a quien ya ha votado (`results` solo si `myVote`; `listOpinions` responde `403` si no se ha votado).
- Excepción: el script de semilla (`prisma/seed.ts`) fija los contadores de los temas de ejemplo directamente. No lo imites en código de la aplicación.

## Borrado de temas

**Solo el autor borra su tema, y solo desde su detalle** (`DELETE /api/topics/:id`, `TopicService.delete`). El servicio borra con `authorId` en el `where` y responde `404` si el tema no existe o no es suyo. Los votos, notificaciones y visitas desaparecen por la cascada de la base de datos (no se borran votos desde código) y la imagen se retira de mejor esfuerzo. La interfaz usa `isAuthor` del detalle solo para mostrar la papelera; no es una medida de seguridad.

## Otras reglas

- **Entradas**: valida con Zod en cada endpoint; los ids se comprueban como UUID y las consultas SQL en bruto usan `Prisma.sql` con parámetros (escapa `%`, `_` y `\` en `LIKE`).
- **Paginación**: por cursor (keyset), 20 elementos por página; los cursores se validan.
- **Datos personales**: el email y `passwordHash` nunca salen en una respuesta. La clave del límite de intentos usa el hash del email.
- **Secretos**: variables de entorno, nunca en el código. El seed de prueba no debe cargarse en producción (`scripts/seed-guard.mjs`).
- **Rutas**: UI en español (`/temas/nuevo`), API en inglés (`/api/topics`).

## Cómo trabajar

- Comandos: `npm run dev`, `npm run lint`, `npm run typecheck`, `npm test` (Vitest), `npm run test:e2e` (Playwright, construye y arranca la app), `npm run prisma:migrate`, `npm run prisma:seed`.
- Las pruebas de integración necesitan PostgreSQL: `docker compose up -d postgres` (puerto 5433, bases `opina` y `opina_test`) y `.env.test`. Los e2e usan `.env`.
- **Metodología (OpenSpec)**: cada cambio vive en `openspec/changes/<nombre>/` con proposal, design, specs y tasks. Cada requisito cita su historia (`HU-XX`), cada tarea su ticket (`TKT-XXX`) y cada `#### Scenario` debe tener al menos un test. Skills: `/opsx:propose`, `/opsx:apply`, `/opsx:archive`.
- Commits en formato Conventional Commits, citando el ticket (`feat(votes): emitir voto TKT-019`).

# Prompt logging

Every prompt submitted by the user in this project is automatically appended to [Prompts.md](Prompts.md) via a `UserPromptSubmit` hook configured in `.claude/settings.json` (`.claude/hooks/log-prompt.cjs`). Do not rely on manually copying prompts there — the hook handles it on every turn.
