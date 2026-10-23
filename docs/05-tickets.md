# 5. Tickets de trabajo

Los tickets se derivan de las historias de usuario ([04-historias-usuario.md](04-historias-usuario.md)) y se agrupan por el cambio SDD en el que se implementan. Cada tarea de `openspec/changes/*/tasks.md` referencia su ticket.

**Tipos:** `SETUP` configuración/infraestructura · `DB` base de datos · `BE` backend · `FE` frontend · `QA` pruebas.
**Definición de hecho (DoD) común:** código con tipos estrictos, lint y typecheck sin errores, pruebas del ticket en verde, escenarios de la spec correspondientes cubiertos, revisión de código aprobada.

## 5.1 Resumen

| Ticket  | Tipo  | Título                                           | HU                  | Depende de | Pts    | Cambio SDD |
| ------- | ----- | ------------------------------------------------ | ------------------- | ---------- | ------ | ---------- |
| TKT-001 | SETUP | Inicializar proyecto Next.js + herramientas      | HU-00               | —          | 2      | fase-1     |
| TKT-002 | SETUP | Entorno local (Docker) y variables de entorno    | HU-00               | 001        | 2      | fase-1     |
| TKT-003 | DB    | Esquema Prisma y migración inicial               | todas               | 002        | 3      | fase-1     |
| TKT-004 | DB    | Datos semilla                                    | todas               | 003        | 2      | fase-1     |
| TKT-005 | BE    | Utilidades comunes de servidor                   | todas               | 003        | 2      | fase-1     |
| TKT-006 | BE    | Autenticación y registro                         | HU-00               | 005        | 3      | fase-1     |
| TKT-007 | FE    | Pantallas de inicio de sesión y registro         | HU-00               | 006        | 2      | fase-1     |
| TKT-008 | FE    | Layout, menú principal y protección de rutas     | HU-00               | 006        | 2      | fase-1     |
| TKT-009 | SETUP | Pipeline de CI                                   | —                   | 001        | 1      | fase-1     |
| TKT-010 | QA    | Pruebas de identificación                        | HU-00               | 006–008    | 2      | fase-1     |
| TKT-011 | BE    | Servicio de tendencias y búsqueda                | HU-01, HU-02        | 005        | 3      | fase-2     |
| TKT-012 | BE    | Endpoint `GET /api/topics`                       | HU-01, HU-02        | 011        | 1      | fase-2     |
| TKT-013 | FE    | Pantalla principal con lista scrolleable         | HU-01               | 012, 008   | 3      | fase-2     |
| TKT-014 | FE    | Buscador                                         | HU-02               | 013        | 2      | fase-2     |
| TKT-015 | QA    | Pruebas de descubrimiento                        | HU-01, HU-02        | 011–014    | 2      | fase-2     |
| TKT-016 | BE    | Política de visibilidad (base) y detalle de tema | HU-03               | 005        | 2      | fase-3     |
| TKT-017 | FE    | Pantalla de tema                                 | HU-03               | 016        | 3      | fase-3     |
| TKT-018 | QA    | Pruebas de acceso a un tema                      | HU-03               | 016–017    | 1      | fase-3     |
| TKT-019 | BE    | Emisión de voto                                  | HU-04, HU-05, HU-06 | 016        | 3      | fase-4     |
| TKT-020 | BE    | Listado de opiniones                             | HU-07               | 019        | 2      | fase-4     |
| TKT-021 | FE    | Flujo de voto con justificación                  | HU-04, HU-05        | 019, 017   | 3      | fase-4     |
| TKT-022 | FE    | Resultados y lista de opiniones                  | HU-06, HU-07        | 020, 021   | 3      | fase-4     |
| TKT-023 | QA    | Pruebas de votación                              | HU-04..07           | 019–022    | 2      | fase-4     |
| TKT-024 | BE    | Almacenamiento de imágenes                       | HU-09               | 002        | 2      | fase-5     |
| TKT-025 | BE    | Creación de temas                                | HU-08..10           | 024, 011   | 3      | fase-5     |
| TKT-026 | FE    | Pantalla de creación de tema                     | HU-08..10           | 025, 008   | 3      | fase-5     |
| TKT-027 | QA    | Pruebas de creación de temas                     | HU-08..10           | 024–026    | 2      | fase-5     |
| TKT-028 | BE    | Amistades y acceso a temas privados              | HU-11               | 016        | 2      | fase-6     |
| TKT-029 | BE    | Generación de notificaciones                     | HU-12               | 025, 028   | 2      | fase-6     |
| TKT-030 | BE    | Endpoint `GET /api/notifications`                | HU-12               | 029        | 1      | fase-6     |
| TKT-031 | FE    | Pantalla de notificaciones                       | HU-12               | 030, 008   | 2      | fase-6     |
| TKT-032 | QA    | Pruebas de temas privados y notificaciones       | HU-11, HU-12        | 028–031    | 2      | fase-6     |
| TKT-033 | DB    | Perfil mínimo y búsqueda por nombre              | HU-13, HU-14        | 003, 004   | 2      | personas   |
| TKT-034 | BE    | Listado y búsqueda de personas                   | HU-13               | 033, 005   | 2      | personas   |
| TKT-035 | BE    | Perfil y temas de una persona                    | HU-14               | 033, 011, 028 | 3   | personas   |
| TKT-036 | BE    | Añadir y quitar amigos                           | HU-15               | 028        | 2      | personas   |
| TKT-037 | FE    | Menú inferior Temas / Personas                   | HU-13               | 008        | 2      | personas   |
| TKT-038 | FE    | Pantalla Personas                                | HU-13               | 034, 037, 014 | 2   | personas   |
| TKT-039 | FE    | Pantalla de perfil con amistad y orden           | HU-14, HU-15        | 035, 036, 038 | 3   | personas   |
| TKT-040 | QA    | Pruebas de personas y amistades                  | HU-13..15           | 033–039    | 2      | personas   |
| TKT-041 | DOC   | Documentación de la app Android                  | HU-16               | —          | 1      | app-movil  |
| TKT-042 | BE    | Sesión por token Bearer                          | HU-16, HU-00        | 006, 008   | 2      | app-movil  |
| TKT-043 | BE    | CORS y perfil por API                            | HU-16, HU-14        | 035        | 1      | app-movil  |
| TKT-044 | FE    | Capa de plataforma y sesión en el cliente        | HU-16               | 042        | 3      | app-movil  |
| TKT-045 | FE    | Pantallas de cliente y rutas por parámetro       | HU-16               | 043, 044   | 3      | app-movil  |
| TKT-046 | BUILD | Build móvil y proyecto Capacitor                 | HU-16               | 045        | 2      | app-movil  |
| TKT-047 | FE    | Funciones nativas de Android                     | HU-16               | 046        | 2      | app-movil  |
| TKT-048 | QA    | Verificación de web y app Android                | HU-16               | 041–047    | 2      | app-movil  |
| TKT-049 | FE    | Pantallas de identificación centradas            | HU-00               | —          | 1      | login-centrado |
| TKT-050 | DOC   | Documentación de las tarjetas de tema            | HU-17, HU-18        | —          | 1      | tarjeta-tema |
| TKT-051 | BE    | Voto propio en los listados de temas             | HU-18               | 011, 035   | 3      | tarjeta-tema |
| TKT-052 | FE    | Tarjeta con fecha y marca de voto                | HU-17, HU-18        | 051        | 3      | tarjeta-tema |
| TKT-053 | QA    | Pruebas de la tarjeta de tema                    | HU-17, HU-18        | 051, 052   | 2      | tarjeta-tema |
| TKT-054 | DOC   | Documentación de las historias de amigos         | HU-19               | —          | 1      | historias |
| TKT-055 | DB    | Tabla de temas visitados y datos semilla         | HU-19               | 003, 004   | 2      | historias |
| TKT-056 | BE    | Visitas e historias (`/api/stories`)             | HU-19               | 055, 028   | 3      | historias |
| TKT-057 | FE    | Burbujas de historias en la pantalla de temas    | HU-19               | 056, 013   | 3      | historias |
| TKT-058 | QA    | Pruebas de las historias                         | HU-19               | 055–057    | 2      | historias |
| TKT-059 | DOC   | Documentación de Mi perfil                       | HU-20, HU-21        | —          | 1      | mi-perfil |
| TKT-060 | BE    | Perfil propio y lista de amigos (`/api/me*`)     | HU-21               | 034        | 2      | mi-perfil |
| TKT-061 | BE    | Editar foto y descripción (`PATCH /api/me`)      | HU-20               | 060, 024   | 3      | mi-perfil |
| TKT-062 | FE    | Pestaña Perfil y pantalla Mi perfil              | HU-21               | 060, 037   | 3      | mi-perfil |
| TKT-063 | FE    | Lista de amigos                                  | HU-21               | 060, 038   | 2      | mi-perfil |
| TKT-064 | FE    | Editar perfil                                    | HU-20               | 061, 062   | 3      | mi-perfil |
| TKT-065 | QA    | Pruebas de Mi perfil                             | HU-20, HU-21        | 059–064    | 2      | mi-perfil |
| TKT-066 | DOC   | Documentación del servidor configurable          | HU-22               | —          | 1      | servidor-red |
| TKT-067 | BE    | Imágenes servidas por la API (`/api/media`)      | HU-22               | 024, 061   | 3      | servidor-red |
| TKT-068 | FE    | Servidor configurable en el build de desarrollo  | HU-22               | 044        | 3      | servidor-red |
| TKT-069 | FE    | URLs de imagen relativas en el cliente           | HU-22               | 067, 068   | 1      | servidor-red |
| TKT-070 | BUILD | HTTP sin cifrar solo en debug                    | HU-22               | 046        | 1      | servidor-red |
| TKT-071 | QA    | Pruebas del servidor configurable                | HU-22               | 066–070    | 2      | servidor-red |
| TKT-072 | DOC   | Documentación del servidor desde «Sin conexión»  | HU-22               | —          | 1      | servidor-sin-conexion |
| TKT-073 | FE    | Cambiar de servidor desde «Sin conexión»         | HU-22               | 068        | 3      | servidor-sin-conexion |
| TKT-074 | QA    | Pruebas del servidor desde «Sin conexión»        | HU-22               | 072, 073   | 2      | servidor-sin-conexion |
|         |       |                                                  |                     |            | **155** |           |

## 5.2 Detalle de tickets

### Fase 1 · Plataforma base (`fase-1-plataforma-base`)

#### TKT-001 · Inicializar proyecto Next.js + herramientas

- **Descripción:** Crear el proyecto con Next.js 15 (App Router, `src/`), TypeScript `strict`, Tailwind CSS, ESLint, Prettier, Vitest + Testing Library y Playwright. Scripts `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`.
- **Criterios:** `npm run lint`, `typecheck`, `test` y `build` terminan sin errores sobre el proyecto vacío.

#### TKT-002 · Entorno local (Docker) y variables de entorno

- **Descripción:** `docker-compose.yml` con PostgreSQL 16 y MinIO (bucket `opina-images` con lectura pública). `.env.example` con las variables de [02-arquitectura.md §2.8](02-arquitectura.md). Módulo `src/server/env.ts` que valida las variables con Zod al arrancar.
- **Criterios:** `docker compose up -d` levanta ambos servicios; el arranque falla con mensaje claro si falta una variable.

#### TKT-003 · Esquema Prisma y migración inicial

- **Descripción:** Implementar el esquema de [03-modelo-datos.md §3.4](03-modelo-datos.md) y la migración con el SQL adicional (pg_trgm, índice trigram, CHECKs). Cliente Prisma singleton en `src/server/db`.
- **Criterios:** `prisma migrate dev` aplica sin errores; las restricciones UNIQUE y CHECK existen en BD.

#### TKT-004 · Datos semilla

- **Descripción:** `prisma/seed.ts` según [03-modelo-datos.md §3.6](03-modelo-datos.md), idempotente.
- **Criterios:** `prisma db seed` ejecutado dos veces deja el mismo estado.

#### TKT-005 · Utilidades comunes de servidor

- **Descripción:** Errores de dominio (`ValidationError`, `NotFoundError`, `ForbiddenError`, `ConflictError`, `UnauthorizedError`), función `toHttpResponse(error)`, codificación/decodificación de cursores opacos, helper `requireUser()` que obtiene el usuario de la sesión o lanza `UnauthorizedError`.
- **Criterios:** tests unitarios de mapeo de errores y de cursores.

#### TKT-006 · Autenticación y registro

- **Descripción:** Auth.js v5 con proveedor Credentials y sesión JWT; `AuthService.register` (Zod: username `[a-z0-9_]{3,30}`, email válido, contraseña ≥ 8) con bcrypt; `POST /api/register`.
- **Criterios:** CA-00.1–CA-00.4. `passwordHash` nunca aparece en respuestas.

#### TKT-007 · Pantallas de inicio de sesión y registro

- **Descripción:** `/login` y `/registro`, mobile-first, con errores de validación y error genérico de credenciales; tras éxito redirigen a `/`.
- **Criterios:** CA-00.1–CA-00.4 desde la UI.

#### TKT-008 · Layout, menú principal y protección de rutas

- **Descripción:** Layout raíz con `MainMenu` (en esta fase: cerrar sesión; las opciones "Crear tema" y "Notificaciones" se añaden en fases 5 y 6). `middleware.ts` redirige a `/login` las rutas no públicas y devuelve `401` en `/api/*` sin sesión.
- **Criterios:** CA-00.5, CA-00.6.

#### TKT-009 · Pipeline de CI

- **Descripción:** GitHub Actions: instalación, lint, typecheck, tests unitarios/integración (con servicio PostgreSQL), build y e2e.
- **Criterios:** el pipeline pasa en la rama principal.

#### TKT-010 · Pruebas de identificación

- **Descripción:** Integración de `AuthService` y `/api/register`; e2e de registro, login, redirección sin sesión y logout.
- **Criterios:** todos los escenarios de `specs/identificacion-usuarios` cubiertos.

### Fase 2 · Listado y búsqueda (`fase-2-listado-busqueda-temas`)

#### TKT-011 · Servicio de tendencias y búsqueda

- **Descripción:** `TopicService.listTrending({ cursor })` y `TopicService.search({ q, cursor })`: solo `PUBLIC`, orden `totalVotes DESC, createdAt DESC, id DESC`, paginación keyset de 20; búsqueda `ILIKE` sobre el título escapando `%` y `_`.
- **Criterios:** CA-01.1, CA-01.3, CA-01.4, CA-02.2, CA-02.5.

#### TKT-012 · Endpoint `GET /api/topics`

- **Descripción:** Sin `q` → tendencias; con `q` (1–100 caracteres tras `trim`) → búsqueda. Respuesta `{ items: TopicSummary[], nextCursor }`.
- **Criterios:** contrato de [02-arquitectura.md §2.5](02-arquitectura.md).

#### TKT-013 · Pantalla principal con lista scrolleable

- **Descripción:** `HomePage` con `TopicList` y `TopicListItem` (título); carga incremental con `IntersectionObserver`; estados de carga y vacío; cada elemento enlaza a `/temas/[id]`.
- **Criterios:** CA-01.1–CA-01.6.

#### TKT-014 · Buscador

- **Descripción:** `SearchBar` fijo en la parte superior; _debounce_ 300 ms; al vaciarlo vuelve a tendencias; mensaje "sin resultados".
- **Criterios:** CA-02.1–CA-02.5.

#### TKT-015 · Pruebas de descubrimiento

- **Descripción:** Integración de ordenación, paginación, exclusión de privados y búsqueda insensible a mayúsculas; e2e de scroll y búsqueda.
- **Criterios:** escenarios de `specs/descubrimiento-temas` cubiertos.

### Fase 3 · Detalle de tema (`fase-3-detalle-tema`)

#### TKT-016 · Política de visibilidad (base) y detalle de tema

- **Descripción:** `VisibilityPolicy.canAccess(topic, viewer)` (en esta fase: público → sí; privado → solo creador; la regla de amigos se amplía en TKT-028). `TopicService.getById` devuelve `TopicDetail` con `myVote` y `results` solo si `myVote` no es nulo. `GET /api/topics/:id` → `404` si no existe o no hay acceso.
- **Criterios:** CA-03.5, CA-03.6.

#### TKT-017 · Pantalla de tema

- **Descripción:** `/temas/[id]` con `TopicImage` (solo si hay imagen, `h-[50dvh] w-full object-cover`), título y `VoteButtons` en la parte inferior (👍 verde, 👎 rojo, con `aria-label`). Si `myVote` existe, renderiza el hueco de `VoteResults` (se completa en fase 4). Página `not-found`.
- **Criterios:** CA-03.1–CA-03.4, CA-03.6.

#### TKT-018 · Pruebas de acceso a un tema

- **Descripción:** Tests de componente (con/sin imagen, votado/no votado) y e2e de navegación desde la lista.
- **Criterios:** escenarios de `specs/detalle-tema` cubiertos.

### Fase 4 · Votación y opiniones (`fase-4-votacion-opiniones`)

#### TKT-019 · Emisión de voto

- **Descripción:** `VoteService.castVote` en transacción: comprueba acceso (`VisibilityPolicy`), normaliza justificación (trim, vacía → `null`, ≤ 500), inserta el voto e incrementa `positiveVotes`/`negativeVotes`/`totalVotes`. Violación de UNIQUE → `ConflictError`. `POST /api/topics/:id/votes`.
- **Criterios:** CA-04.2, CA-04.3, CA-05.2–CA-05.4, CA-06.2, CA-06.3.

#### TKT-020 · Listado de opiniones

- **Descripción:** `VoteService.listOpinions`: votos con justificación, orden `createdAt DESC, id DESC`, keyset de 20, con `username`. Requiere que el solicitante haya votado (`403` si no). `GET /api/topics/:id/opinions`.
- **Criterios:** CA-07.1, CA-07.3, CA-07.4, CA-07.6.

#### TKT-021 · Flujo de voto con justificación

- **Descripción:** `JustificationDialog` accesible (foco atrapado, `Esc` cancela) con `textarea` opcional (contador 0/500), botones "Cancelar" y "Votar". Al confirmar llama a la API; gestiona `409` refrescando el tema.
- **Criterios:** CA-04.1, CA-04.4, CA-05.1–CA-05.3.

#### TKT-022 · Resultados y lista de opiniones

- **Descripción:** `VoteResults` sustituye a `VoteButtons` sin recargar: totales 👍/👎 y `OpinionList` con scroll continuo; `OpinionItem` verde (UP) o rojo (DOWN), con nombre de usuario y justificación; estado "aún no hay opiniones".
- **Criterios:** CA-06.1, CA-06.2, CA-07.2–CA-07.5.

#### TKT-023 · Pruebas de votación

- **Descripción:** Integración (voto único concurrente, contadores, justificación vacía, opiniones solo con justificación, 403 sin voto) y e2e del flujo completo.
- **Criterios:** escenarios de `specs/votacion` cubiertos.

### Fase 5 · Creación de temas (`fase-5-creacion-temas`)

#### TKT-024 · Almacenamiento de imágenes

- **Descripción:** Interfaz `ImageStorage` con implementación S3 (`@aws-sdk/client-s3`, compatible con MinIO) y _fake_ en memoria para tests. Validación por _magic bytes_ (JPEG/PNG/WebP) y tamaño ≤ 5 MB; clave `topics/<uuid>.<ext>`.
- **Criterios:** CA-09.1, CA-09.3.

#### TKT-025 · Creación de temas

- **Descripción:** `TopicService.create({ title, visibility, image? }, author)`: valida con Zod, sube la imagen si existe, inserta el tema. `POST /api/topics` (`multipart/form-data`) → `201 { id }`; `400`/`413`/`415` según el caso.
- **Criterios:** CA-08.2–CA-08.4, CA-09.1–CA-09.3, CA-10.1, CA-10.2.

#### TKT-026 · Pantalla de creación de tema

- **Descripción:** Opción "Crear tema" en `MainMenu`; `/temas/nuevo` con título, selector de imagen opcional y selector Público/Privado; errores de validación; tras éxito redirige a `/temas/[id]`.
- **Criterios:** CA-08.1–CA-08.4, CA-09.1, CA-10.1, CA-10.3.

#### TKT-027 · Pruebas de creación de temas

- **Descripción:** Integración con `ImageStorage` fake; e2e de creación pública con imagen y privada sin imagen; comprobación de que el privado no aparece en listado/búsqueda.
- **Criterios:** escenarios de `specs/creacion-temas` cubiertos.

### Fase 6 · Temas privados y notificaciones (`fase-6-temas-privados-notificaciones`)

#### TKT-028 · Amistades y acceso a temas privados

- **Descripción:** `FriendshipService.getFriendIds` y `areFriends`. Ampliar `VisibilityPolicy`: privado → creador o amigo del creador. Aplicado en detalle, voto y opiniones.
- **Criterios:** CA-11.1–CA-11.4.

#### TKT-029 · Generación de notificaciones

- **Descripción:** `NotificationService.notifyFriendsOfPrivateTopic(topic, tx)` invocado desde `TopicService.create` dentro de la misma transacción; una notificación `PRIVATE_TOPIC_CREATED` por amigo. Temas públicos no notifican.
- **Criterios:** CA-12.1, CA-12.5, CA-12.6.

#### TKT-030 · Endpoint `GET /api/notifications`

- **Descripción:** `NotificationService.listForUser` (keyset de 20, más recientes primero) con `actor.username` y `topic.{id,title}`.
- **Criterios:** CA-12.2, CA-12.3.

#### TKT-031 · Pantalla de notificaciones

- **Descripción:** Opción "Notificaciones" en `MainMenu`; `/notificaciones` con texto "<usuario> ha creado una nueva propuesta: <título>"; cada elemento enlaza a `/temas/[id]`; estado vacío.
- **Criterios:** CA-12.2–CA-12.4.

#### TKT-032 · Pruebas de temas privados y notificaciones

- **Descripción:** Integración de la política con amigo/no amigo/creador en detalle, voto y opiniones; e2e: `ana` crea un privado → `bruno` recibe notificación, entra y vota → `dani` recibe `404`.
- **Criterios:** escenarios de `specs/temas-privados` y `specs/notificaciones` cubiertos.

### Personas y amistades (`personas-y-amistades`)

#### TKT-033 · Perfil mínimo y búsqueda por nombre

- **Descripción:** Migración que añade `users.avatar_url` y `users.bio` (≤ 160) opcionales y el índice trigram sobre `lower(username)`. Seed con fotos (`picsum.photos`) y descripciones, un usuario sin perfil y usuarios extra para paginar. Actualizar `docs/02` y `docs/03`.
- **Criterios:** CA-13.2, CA-14.2.

#### TKT-034 · Listado y búsqueda de personas

- **Descripción:** `UserService.search` (excluye al propio usuario, `isFriend` por `LEFT JOIN`, orden `lower(username), id`, keyset de 20) y `GET /api/users?q=&cursor=`. Nunca expone el email.
- **Criterios:** CA-13.2–CA-13.4.

#### TKT-035 · Perfil y temas de una persona

- **Descripción:** `UserService.getProfile`, `VisibilityPolicy.canSeePrivateTopicsOf`, `TopicService.listByAuthor` con órdenes `recent` y `top` (generalizando `queryPage`) y `GET /api/users/[id]/topics?sort=&cursor=`.
- **Criterios:** CA-14.2–CA-14.5.

#### TKT-036 · Añadir y quitar amigos

- **Descripción:** `FriendshipService.add` / `remove` simétricos, atómicos e idempotentes; `PUT` y `DELETE /api/users/[id]/friendship` → `200 { isFriend }`; `400` sobre uno mismo, `404` si no existe.
- **Criterios:** CA-15.1–CA-15.5.

#### TKT-037 · Menú inferior Temas / Personas

- **Descripción:** `BottomNav` fijo en el layout `(main)` con fondo amarillo de marca y pestaña activa en píldora blanca (`aria-current`); `padding-bottom` del contenido con zona segura.
- **Criterios:** CA-13.1.

#### TKT-038 · Pantalla Personas

- **Descripción:** `/personas` con `SearchBar` parametrizado y `PeopleList` (tarjetas con `Avatar`, nombre e indicador «Amigo» / «No amigo»), primera página en servidor y scroll infinito con `useInfiniteList`.
- **Criterios:** CA-13.2–CA-13.4, CA-14.1.

#### TKT-039 · Pantalla de perfil con amistad y orden

- **Descripción:** `/personas/[id]` con `ProfileHeader` amarillo, `FriendToggle` optimista (`aria-pressed`), `SortSelector` segmentado y temas del autor con etiqueta «Privado»; `not-found` propio.
- **Criterios:** CA-14.1–CA-14.5, CA-15.1–CA-15.5.

#### TKT-040 · Pruebas de personas y amistades

- **Descripción:** e2e: `dani` busca a `ana`, abre su perfil, la añade, ve y vota su tema privado, cambia el orden, la quita y pierde el acceso; verificación final y revisión visual y de accesibilidad.
- **Criterios:** escenarios de `specs/menu-inferior`, `specs/personas` y `specs/amistades` cubiertos.

### App móvil (`app-movil-empaquetada`)

#### TKT-041 · Documentación de la app Android

- **Descripción:** Actualizar producto (S-09, fuera de alcance), stack, arquitectura (§2.9), historias (E8 · HU-16), tickets y README.
- **Criterios:** la documentación describe web + app Android y cómo generar el APK.

#### TKT-042 · Sesión por token Bearer

- **Descripción:** `POST /api/auth/token` (token JWE de Auth.js con sal propia, 30 días); `readBearerUser` compatible con Edge; `requireUser` y el middleware aceptan cookie o Bearer.
- **Criterios:** CA-16.2; escenarios de `specs/identificacion-usuarios` del cambio.

#### TKT-043 · CORS y perfil por API

- **Descripción:** CORS en el middleware para los orígenes de Capacitor (incluido `OPTIONS` y las respuestas `401`); `GET /api/users/[id]`.
- **Criterios:** CA-16.1, CA-14.5.

#### TKT-044 · Capa de plataforma y sesión en el cliente

- **Descripción:** `apiFetch` (URL base, Bearer, `401`, fallo de red), `tokenStore` con Preferences, `login` / `logout` para web y app, `AuthGate` y `SessionProvider` solo en la web.
- **Criterios:** CA-16.2.

#### TKT-045 · Pantallas de cliente y rutas por parámetro

- **Descripción:** Inicio, Personas, notificaciones, tema (`/tema?id=`) y perfil (`/persona?id=`) cargan sus datos desde el cliente; redirecciones permanentes de `/temas/:id` y `/personas/:id` en la web.
- **Criterios:** CA-16.1; escenarios de `specs/personas`, `specs/amistades`, `specs/menu-inferior` e `specs/identidad-visual` del cambio.

#### TKT-046 · Build móvil y proyecto Capacitor

- **Descripción:** Modo `OPINA_TARGET=mobile` en `next.config.ts` (export a `out-mobile`), `capacitor.config.ts`, scripts `build:mobile`, `build:mobile:dev`, `android:apk`, `android:release` y `android:assets`.
- **Criterios:** el export no contiene la API y el APK se genera sin errores.

#### TKT-047 · Funciones nativas de Android

- **Descripción:** `NativeShell` (botón atrás, barra de estado, pantalla de arranque), `OfflineScreen` con `@capacitor/network`, icono y arranque generados desde el logotipo.
- **Criterios:** CA-16.3–CA-16.5.

#### TKT-048 · Verificación de web y app Android

- **Descripción:** lint, typecheck, pruebas unitarias, de integración y e2e; recorrido manual de la app en un móvil real.
- **Criterios:** escenarios de `specs/app-movil` comprobados en el dispositivo.

### Login centrado (`login-centrado`)

#### TKT-049 · Pantallas de identificación centradas

- **Descripción:** En `/login` y `/registro`, la tarjeta del formulario deja de solapar la cabecera amarilla y se centra en horizontal y en vertical en el espacio bajo ella; si no cabe, la pantalla se desplaza.
- **Criterios:** escenarios del requisito «Pantallas de identificación centradas» de `specs/identidad-visual`.

### Tarjeta de tema (`tarjeta-tema-fecha-y-voto`)

#### TKT-050 · Documentación de las tarjetas de tema

- **Descripción:** Actualizar producto (F-01), historias (E9 · HU-17, HU-18), tickets y contrato de la API (`TopicSummary`).
- **Criterios:** la documentación describe la fecha y la marca de voto en las tarjetas.

#### TKT-051 · Voto propio en los listados de temas

- **Descripción:** `queryPage` recibe `viewerId` y hace `LEFT JOIN votes`; `TopicSummary` gana `myVote` y `results?` (solo si ha votado); `listTrending`, `search` y `listByAuthor` lo propagan.
- **Criterios:** CA-18.2–CA-18.4; no se filtra el voto ni el desglose de quien no ha votado (S-03).

#### TKT-052 · Tarjeta con fecha y marca de voto

- **Descripción:** `formatRelativeDate`; `TopicListItem` con chip de fecha, fondo verde o rojo suave, desglose con `ThumbIcon` y etiqueta accesible; `TopicView` invalida también `["user-topics"]` al votar.
- **Criterios:** CA-17.1, CA-17.2, CA-18.1–CA-18.4.

#### TKT-053 · Pruebas de la tarjeta de tema

- **Descripción:** e2e: votar un tema y volver a la lista; los no votados muestran solo total y fecha; comprobación en el móvil.
- **Criterios:** escenarios de `specs/identidad-visual` del cambio cubiertos.

### Historias de amigos (`historias-amigos`)

#### TKT-054 · Documentación de las historias de amigos

- **Descripción:** Actualizar producto (C-11, F-08), historias (E10 · HU-19), tickets, arquitectura (componentes, API, servicios) y modelo de datos (`topic_views`, seed).
- **Criterios:** la documentación describe las burbujas y el registro de visitas.

#### TKT-055 · Tabla de temas visitados y datos semilla

- **Descripción:** Modelo `TopicView` con clave primaria `(user_id, topic_id)` y migración `add_topic_views`; el seed crea o renueva tres temas de historia de `carla` y `bruno` y borra las visitas de `ana` a ellos.
- **Criterios:** `npm run db:reset` aplica migración y seed; borrar un tema borra sus visitas.

#### TKT-056 · Visitas e historias

- **Descripción:** `TopicService.getById` registra la visita (`ON CONFLICT DO NOTHING`, solo temas ajenos y accesibles); `StoryService.listForUser` y `GET /api/stories`.
- **Criterios:** CA-19.3, CA-19.5.

#### TKT-057 · Burbujas de historias en la pantalla de temas

- **Descripción:** `StoriesBar` entre el buscador y la lista (oculta con búsqueda), enlace al tema pendiente más antiguo; `TopicScreen` invalida `["stories"]` al cargar un tema.
- **Criterios:** CA-19.1, CA-19.2, CA-19.4.

#### TKT-058 · Pruebas de las historias

- **Descripción:** e2e: `bruno` crea un tema, `ana` ve la burbuja, la abre y desaparece; un tema de `dani` no genera burbuja; comprobación en el móvil.
- **Criterios:** escenarios de `specs/historias` cubiertos.

### Mi perfil (`mi-perfil`)

#### TKT-059 · Documentación de Mi perfil

- **Descripción:** Actualizar producto (C-12, F-09, S-01, fuera de alcance), historias (E11 · HU-20, HU-21), tickets y arquitectura (pantallas, API, almacenamiento).
- **Criterios:** la documentación describe la pestaña Perfil y la edición de foto y descripción.

#### TKT-060 · Perfil propio y lista de amigos

- **Descripción:** `UserService.getOwnProfile` (con `topicsCount` y `friendsCount`) y `listFriends`; `GET /api/me` y `GET /api/me/friends`.
- **Criterios:** CA-21.1, CA-21.2; sin email en las respuestas.

#### TKT-061 · Editar foto y descripción

- **Descripción:** `PATCH /api/me` (`multipart/form-data`), `updateProfileSchema`, `ImageStorage.upload` con prefijo `avatars/`, borrado de la foto anterior.
- **Criterios:** CA-20.1, CA-20.2, CA-20.4; los errores `400`, `413` y `415` no cambian ningún dato.

#### TKT-062 · Pestaña Perfil y pantalla Mi perfil

- **Descripción:** tercera pestaña de `BottomNav`; `/perfil` con `ProfileHeader` ampliado (contadores y «Editar perfil») y «Mis temas» con `ProfileTopics`.
- **Criterios:** CA-21.1, CA-21.3.

#### TKT-063 · Lista de amigos

- **Descripción:** `/perfil/amigos` con `PersonListItem`, scroll infinito y estado vacío; `FriendToggle` invalida el perfil propio y la lista.
- **Criterios:** CA-21.2.

#### TKT-064 · Editar perfil

- **Descripción:** `/perfil/editar` con foto (vista previa, cambiar, quitar), descripción con contador, «Guardar» y «Cancelar»; invalidación de cachés al guardar.
- **Criterios:** CA-20.1–CA-20.4.

#### TKT-065 · Pruebas de Mi perfil

- **Descripción:** e2e del perfil, la edición, la lista de amigos y «Mis temas»; actualización de las pruebas que asumían dos pestañas; comprobación en el móvil.
- **Criterios:** escenarios de `specs/mi-perfil` y `specs/menu-inferior` del cambio cubiertos.

### Servidor configurable en red local (`servidor-configurable-red-local`)

#### TKT-066 · Documentación del servidor configurable

- **Descripción:** Actualizar historias (HU-22), tickets, arquitectura (`/api/media`, servidor configurable), modelo de datos (claves de imagen) y README (uso en red local).
- **Criterios:** la documentación describe cómo usar la app de desarrollo sin cable.

#### TKT-067 · Imágenes servidas por la API

- **Descripción:** `ImageStorage.read` y claves en base de datos; `toMediaUrl`; `GET /api/media/[...key]` público con caché; migración `media_keys`.
- **Criterios:** CA-22.4; las imágenes externas del seed no cambian.

#### TKT-068 · Servidor configurable en el build de desarrollo

- **Descripción:** `server-store`, validación con `/api/health`, pantalla `/servidor`, enlace en el login y en el menú, y cierre de sesión al cambiar de servidor.
- **Criterios:** CA-22.1–CA-22.3.

#### TKT-069 · URLs de imagen relativas en el cliente

- **Descripción:** `resolveMediaUrl` en `Avatar`, `TopicImage` y `TopicListItem`.
- **Criterios:** CA-22.4.

#### TKT-070 · HTTP sin cifrar solo en debug

- **Descripción:** `network_security_config` y manifiesto del build `debug`; variable de build `NEXT_PUBLIC_OPINA_SERVER_CONFIGURABLE`.
- **Criterios:** CA-22.1; el release no admite HTTP sin cifrar.

#### TKT-071 · Pruebas del servidor configurable

- **Descripción:** pruebas unitarias, de integración y E2E; comprobación en el móvil sin cable y en la misma red.
- **Criterios:** escenarios de `specs/app-movil` del cambio cubiertos.

### Servidor desde «Sin conexión» (`servidor-desde-sin-conexion`)

#### TKT-072 · Documentación del servidor desde «Sin conexión»

- **Descripción:** Añadir CA-22.5 a HU-22, estos tickets y una nota en el README sobre cómo salir de «Sin conexión» cambiando de servidor.
- **Criterios:** la documentación describe cómo recuperar la app de desarrollo cuando el servidor no responde.

#### TKT-073 · Cambiar de servidor desde «Sin conexión»

- **Descripción:** Extraer `ServerForm` de `ServerScreen`; `OfflineScreen` muestra el servidor en uso y «Cambiar servidor» con ese formulario (solo con `isServerConfigurable()`); `NativeShell` pausa los reintentos mientras se edita y quita «Sin conexión» al cambiar de servidor.
- **Criterios:** CA-22.5; `/servidor` no cambia de comportamiento; en producción «Sin conexión» queda como antes.

#### TKT-074 · Pruebas del servidor desde «Sin conexión»

- **Descripción:** pruebas de componente de `ServerForm`, `OfflineScreen` y `NativeShell`; comprobación en el móvil sin cable.
- **Criterios:** escenarios de `specs/app-movil` del cambio cubiertos.
