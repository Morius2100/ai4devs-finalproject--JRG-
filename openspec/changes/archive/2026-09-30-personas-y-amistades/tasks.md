## 1. Modelo de datos y documentación

- [x] 1.1 Actualizar `docs/03-modelo-datos.md` (TKT-033):
  - columnas `users.avatar_url` y `users.bio`;
  - índice `users_username_trgm_idx`;
  - escritura de `friendships` desde la aplicación.
- [x] 1.2 Actualizar `docs/02-arquitectura.md` (TKT-033):
  - rutas `/personas` y `/personas/[id]`;
  - endpoints `/api/users*`;
  - `UserService`;
  - `FriendshipService.add` / `remove`;
  - `BottomNav` en el layout `(main)`.
- [x] 1.3 Añadir `avatarUrl String? @map("avatar_url")` y `bio String? @db.VarChar(160)` a `User` en `prisma/schema.prisma`, y crear la migración `add_user_profile_and_username_search`. La migración incluye el índice `CREATE INDEX users_username_trgm_idx ON users USING gin (lower(username) gin_trgm_ops)` añadido a mano en el SQL (TKT-033).
- [x] 1.4 Actualizar `prisma/seed.ts` (TKT-033):
  - descripciones y fotos `https://picsum.photos/seed/<username>/200` para ana, bruno y carla;
  - "dani" sin foto ni descripción;
  - al menos 25 usuarios extra (`persona01`…) para probar la paginación;
  - temas públicos y privados de "ana" con votos y fechas distintos.
- [x] 1.5 Pruebas: `npx prisma migrate reset --force` aplica la migración y el seed sin errores, y un test de integración comprueba que un usuario registrado queda con `avatarUrl` y `bio` nulos (escenario "Usuario registrado sin perfil").

## 2. Backend: listado y búsqueda de personas

- [x] 2.1 Mover `escapeLikePattern` de `topic-service.ts` a `src/server/sql.ts` y usarlo desde `TopicService` sin cambiar su comportamiento (TKT-034).
- [x] 2.2 Crear `src/lib/validation/users.ts` con `listUsersQuerySchema` (`q` recortado de 1 a 100 caracteres, opcional, y `cursor`), `userTopicsQuerySchema` (`sort`: `recent` | `top`, por defecto `recent`, y `cursor`) y `userIdSchema` (UUID) (TKT-034).
- [x] 2.3 Crear `src/server/services/user-service.ts` con `UserService.search({ viewerId, q?, cursor? })` (TKT-034):
  - SQL crudo con `LEFT JOIN friendships` para calcular `isFriend`;
  - excluye al propio usuario;
  - filtro `lower(username) LIKE lower(pattern) ESCAPE '\'`;
  - orden `lower(username), id`;
  - cursor `[lowerUsername, id]`, páginas de 20;
  - devuelve `PeoplePage = { items: { id, username, avatarUrl, isFriend }[], nextCursor }`.
- [x] 2.4 Crear `src/app/api/users/route.ts` con `GET` (`requireUser`, validación con `listUsersQuerySchema`, `toHttpResponse` para errores) (TKT-034).
- [x] 2.5 Pruebas: tests de integración de `UserService.search` y `GET /api/users` que cubren:
  - "Lista con indicador de amistad";
  - "Sin otras personas";
  - "Buscar por parte del nombre", incluido el escape de `%` y `_`;
  - "Sin resultados";
  - "Más de una página" (45 personas, sin repetidos);
  - "Respuesta sin datos privados", es decir, sin `email` ni `passwordHash`;
  - `401` sin sesión.

## 3. Backend: perfil y temas de una persona

- [x] 3.1 Añadir `VisibilityPolicy.canSeePrivateTopicsOf(authorId, viewerId)` (creador o amigo), reutilizando la misma regla que `canAccess`, con tests unitarios (TKT-035).
- [x] 3.2 Añadir `UserService.getProfile(id, viewerId)` → `{ id, username, avatarUrl, bio, isFriend, isSelf }`. Lanza `NotFoundError` si el id no es un UUID o no existe (TKT-035).
- [x] 3.3 Generalizar `queryPage` en `topic-service.ts` (TKT-035):
  - recibe un filtro `Prisma.Sql` completo y un modo de orden;
  - `trending` / `top` usan `total_votes DESC, created_at DESC, id DESC` con el cursor de 3 claves;
  - `recent` usa `created_at DESC, id DESC` con cursor `[createdAt, id]`;
  - añade `visibility` a `TopicSummary`;
  - `listTrending` y `search` quedan con el mismo resultado.
- [x] 3.4 Añadir `TopicService.listByAuthor({ authorId, viewerId, sort, cursor })`: sin filtro de visibilidad si `canSeePrivateTopicsOf`; si no, solo `PUBLIC` (TKT-035).
- [x] 3.5 Crear `src/app/api/users/[id]/topics/route.ts` con `GET` (TKT-035):
  - responde `404` si la persona no existe o el id no es válido;
  - responde `400` si `sort` o `cursor` son inválidos.
- [x] 3.6 Pruebas: tests de integración que cubren:
  - "Visitante que no es amigo";
  - "Visitante amigo";
  - "Persona sin temas";
  - "Orden por defecto";
  - "Más puntuados";
  - "Abrir el propio perfil" (el creador ve sus privados);
  - "Identificador desconocido";
  - paginación de 20 en ambos órdenes.

  Además, `topic-service.test.ts` y los tests de descubrimiento deben seguir en verde sin modificarlos.

## 4. Backend: añadir y quitar amigos

- [x] 4.1 Añadir `FriendshipService.add(userId, friendId)` y `remove(userId, friendId)` (TKT-036):
  - `ValidationError` si son el mismo usuario;
  - `NotFoundError` si el destino no existe;
  - transacción con `createMany({ skipDuplicates: true })` / `deleteMany` en ambos sentidos;
  - devuelven `{ isFriend }`.

  Hay que actualizar el comentario de cabecera, que dice que el servicio es de solo lectura.
- [x] 4.2 Crear `src/app/api/users/[id]/friendship/route.ts` con `PUT` (añadir) y `DELETE` (quitar), ambos `200 { isFriend }` (TKT-036).
- [x] 4.3 Pruebas: tests de integración que cubren:
  - "Añadir un amigo", con filas en ambos sentidos;
  - "Petición repetida";
  - "Quitar un amigo", incluido `DELETE` repetido sin error;
  - "Intento de auto-amistad por API" (`400` en `PUT` y `DELETE`);
  - "Persona inexistente";
  - "Acceso tras añadir" y "Pérdida de acceso tras quitar", sobre `TopicService.getById` y `VoteService`;
  - "Sin notificación tras quitar", sobre `NotificationService`.

## 5. Frontend: menú inferior

- [x] 5.1 Leer en `node_modules/next/dist/docs/` las guías de `usePathname`, layouts de grupos de rutas, rutas dinámicas (`params` como promesa) y `notFound()` en esta versión de Next.js (TKT-037).
- [x] 5.2 Crear `src/components/BottomNav.tsx` (TKT-037):
  - `<nav aria-label="Secciones">` fijo abajo, con fondo `bg-brand-yellow`;
  - dos `Link` de al menos 44 px (icono SVG en línea + texto): «Temas» → `/`, «Personas» → `/personas`;
  - pestaña activa en píldora `bg-white` con `aria-current="page"`: Personas para `/personas*`, Temas para `/` y `/temas*`;
  - pestaña inactiva en `text-on-yellow` sin píldora ni opacidad reducida, con contraste ≥ 4.5:1.
- [x] 5.3 Añadir `BottomNav` a `src/app/(main)/layout.tsx` y dar al `<main>` un `padding-bottom` igual a la altura del menú más `env(safe-area-inset-bottom)` (TKT-037).
- [x] 5.4 Pruebas: tests unitarios de `BottomNav` que cubren:
  - "Pantalla por defecto tras iniciar sesión";
  - "Perfil dentro de Personas";
  - "Crear tema dentro de Temas";
  - ninguna pestaña activa en `/notificaciones`.

  Revisar también a 375 px, en claro y oscuro, los escenarios "Pestaña activa destacada", "Último elemento visible" y "Contraste en modo oscuro".

## 6. Frontend: pantalla Personas

- [x] 6.1 Parametrizar `SearchBar` con `placeholder` y `ariaLabel` (por defecto los de temas) sin cambiar su comportamiento (TKT-038).
- [x] 6.2 Extraer de `TopicList` un hook `useInfiniteList` (deduplicación por `id` y `IntersectionObserver`) y usarlo en `TopicList` sin cambiar su comportamiento (TKT-038).
- [x] 6.3 Crear `src/components/people/Avatar.tsx`: foto con `next/image` o círculo con la inicial y un color derivado del `username` (paleta fija con contraste para el texto blanco) (TKT-038).
- [x] 6.4 Crear `src/lib/api/users.ts` (`fetchPeoplePage`, `fetchUserTopicsPage`, `setFriendship`) siguiendo `src/lib/api/topics.ts` (TKT-038).
- [x] 6.5 Crear `PersonListItem`, `PeopleList` y `PeopleScreen` en `src/components/people/` con el estilo del diseño A (TKT-038):
  - tarjeta `rounded-2xl` con avatar de 44 px, nombre y `@username`;
  - etiqueta «Amigo» (verde claro con check) o «No amigo» (gris);
  - enlace a `/personas/[id]`;
  - estados de carga, vacío y error.
- [x] 6.6 Crear `src/app/(main)/personas/page.tsx`: primera página renderizada en el servidor según `?q=` (TKT-038).
- [x] 6.7 Pruebas: tests unitarios de `PersonListItem` y `Avatar` que cubren "Lista con indicador de amistad", "Persona sin foto" y "Abrir un perfil", y comprobación del escenario "Búsqueda compartible".

## 7. Frontend: pantalla de perfil

- [x] 7.1 Crear `src/app/(main)/personas/[id]/page.tsx` y `not-found.tsx` (TKT-039):
  - la página carga `getProfile` y la primera página de `listByAuthor` (`recent`) en el servidor, y llama a `notFound()` si no existe la persona;
  - `not-found.tsx` muestra «Persona no encontrada» con un `btn-primary` a `/personas`.
- [x] 7.2 Crear `ProfileHeader` (TKT-039):
  - cabecera amarilla `rounded-b-[28px]`;
  - avatar de 88 px con borde blanco, nombre y `@username`;
  - descripción solo si existe.
- [x] 7.3 Crear `FriendToggle` (TKT-039):
  - píldora a todo el ancho con `aria-pressed`: «Amigos» relleno en verde, o «Añadir a amigos» con borde verde;
  - `useMutation` optimista, con el botón deshabilitado mientras se envía;
  - si falla, revierte y muestra un `role="alert"` con «No se ha podido actualizar la amistad»;
  - al terminar, invalida `["users"]` y `["user-topics", id]`;
  - no se muestra si `isSelf`.
- [x] 7.4 Crear `SortSelector` como control segmentado (TKT-039):
  - `role="group"`, etiqueta «Ordenar temas» y dos botones con `aria-pressed`: «Más recientes» (por defecto) y «Más puntuados»;
  - `ProfileTopics` con `useInfiniteList` y `queryKey` `["user-topics", id, sort]`;
  - encabezado «Temas de <usuario>» y estado vacío.
- [x] 7.5 Añadir a `TopicListItem` la etiqueta «Privado» cuando `topic.visibility === "PRIVATE"` (TKT-039).
- [x] 7.6 Pruebas: tests unitarios que cubren:
  - de `ProfileHeader`: "Perfil completo" y "Perfil sin foto ni descripción";
  - de `FriendToggle`: "Perfil de un amigo", "Perfil de alguien que no es amigo" y "Fallo de red";
  - de `SortSelector`: `aria-pressed` y cambio de orden;
  - de `TopicListItem`: la etiqueta «Privado».

## 8. Pruebas end-to-end y verificación final

- [x] 8.1 Crear `tests/e2e/personas-amistades.spec.ts` (TKT-040). El flujo es:
  1. "dani" inicia sesión, ve la pestaña Temas activa y pulsa Personas.
  2. Busca "ana" y ve «No amigo».
  3. Abre su perfil, solo con temas públicos.
  4. Pulsa «Añadir a amigos» y aparece su tema privado con «Privado».
  5. Cambia a «Más puntuados» y el orden cambia.
  6. Abre el tema privado y puede votar.
  7. Vuelve al perfil y pulsa «Amigos».
  8. La URL del tema privado responde «Tema no encontrado».
- [x] 8.2 Ejecutar `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test` y `npm run test:e2e` sin errores (TKT-040).
- [x] 8.3 Revisión visual con la aplicación en `localhost:3000`, a 375 px y en escritorio, en claro y oscuro (TKT-040):
  - pantallas: Temas, Personas (con y sin búsqueda, vacío), perfil de amigo, de no amigo, propio y inexistente, crear tema y notificaciones;
  - comprobar que coincide con el diseño A de `docs/mockups/personas-disenos.html`, salvo el menú inferior, que es el amarillo del diseño C.
- [x] 8.4 Pruebas: recorrer con Tab el menú inferior, el buscador, la lista, el check y el selector de orden, comprobando el foco visible y el anuncio de `aria-current` / `aria-pressed`. Así se cubre el requisito de accesibilidad de `identidad-visual` y los escenarios de `menu-inferior`.
