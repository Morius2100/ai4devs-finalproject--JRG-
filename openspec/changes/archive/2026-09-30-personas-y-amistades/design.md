## Context

- **Amistades.** Existe la tabla `friendships`, simétrica en dos filas (`docs/03-modelo-datos.md` §3.3). `FriendshipService` solo sabe leerla (`areFriends`, `getFriendIds`), y las amistades salen del seed (Q-01).
- **Políticas que ya consumen la amistad.** `VisibilityPolicy` y `NotificationService.notifyFriendsOfPrivateTopic` la consultan en cada petición, así que añadir y quitar amigos las afecta sin tocarlas.
- **Usuarios.** `User` solo tiene `username`, `email`, `passwordHash` y `createdAt`. No hay foto ni descripción.
- **Temas.** `TopicService.queryPage` hace paginación keyset de 20 con el orden `total_votes DESC, created_at DESC, id DESC`, y tiene fijado `visibility = 'PUBLIC'`.
- **Frontend.**
  - El layout `(main)` pinta la cabecera `MainMenu` y el contenido; no hay navegación inferior.
  - La pantalla principal es `HomeScreen` = `SearchBar` (sticky, amarilla, con debounce y `?q=`) + `TopicList` (`useInfiniteQuery` con primera página del servidor).
  - La pantalla de tema (`src/app/temas/[id]`) está fuera de `(main)` y tiene su propio pie fijo de votación.
- **Diseño elegido.** El diseño "A · Clásico" de `docs/mockups/personas-disenos.html`, con un único cambio tomado del "C · Cuadrícula": el menú inferior con fondo amarillo y la pestaña activa en una píldora blanca.
- **Restricción del proyecto.** No añadir nada fuera de `docs/01-producto.md`. Este cambio amplía el producto a petición del usuario, así que actualiza primero esa documentación (Q-01, S-01, S-02, fuera de alcance) y las historias y tickets.

## Goals / Non-Goals

**Goals:**
- Formar la lista de amigos desde la propia aplicación: buscar persona → ver perfil → añadir o quitar.
- Añadir un menú inferior Temas / Personas coherente con la identidad visual actual.
- Mostrar un perfil mínimo (foto, nombre, descripción) y los temas de la persona con dos órdenes.
- Reutilizar los patrones existentes: servicios + rutas `app/api`, keyset con cursor opaco, `useInfiniteQuery` con primera página del servidor, y `VisibilityPolicy` como único punto de decisión de acceso.

**Non-Goals:**
- Editar el propio perfil, subir la foto o cambiar la descripción. Los datos salen del seed.
- Solicitudes de amistad con aceptación o rechazo, bloqueos y sugerencias de amigos.
- Notificaciones por hacerse amigos.
- Mostrar temas privados en tendencias o búsqueda (S-06 no cambia; Q-03 sigue abierta para esos listados).
- Contadores de amigos o temas en el perfil, y listas de amigos de otra persona.

## Decisions

### 1. Rutas: `/personas` y `/personas/[id]` dentro de `(main)`
- **Qué:** las dos pantallas viven en el grupo `(main)`, así que heredan `MainMenu`, el `BottomNav` y la protección del middleware (que ya exige sesión en todo salvo login y registro).
- **Por qué el id en la URL:** se usa el UUID y no el `username`, por coherencia con `/temas/[id]`. Además permite la validación `z.string().uuid()` y trata un id mal formado como «no encontrado».
- **Alternativa descartada:** `/personas/[username]`, con URLs más legibles. Se descarta porque añade codificación de caracteres y un segundo criterio de búsqueda sin necesidad.

### 2. `BottomNav` en el layout `(main)`
- **Componente:** nuevo componente cliente `src/components/BottomNav.tsx`, un `<nav aria-label="Secciones">` fijo abajo (`fixed inset-x-0 bottom-0`).
- **Aspecto:** fondo `bg-brand-yellow` y dos enlaces `next/link` (icono SVG en línea + texto) de al menos 44 px.
- **Pestaña activa:**
  - Se calcula con `usePathname()`: Personas si la ruta empieza por `/personas`, y Temas si es `/` o empieza por `/temas`.
  - En `/notificaciones` no se marca ninguna.
  - La activa lleva `bg-white` en píldora, `aria-current="page"` y texto `text-on-yellow`. La inactiva lleva el mismo color, sin píldora ni negrita y sin reducir la opacidad, para mantener el contraste ≥ 4.5:1.
- **Hueco para el menú:** el `<main>` del layout recibe un `padding-bottom` igual a la altura del menú más `env(safe-area-inset-bottom)`, para que nada quede oculto.
- **Pantalla de tema:** se queda sin menú inferior porque está fuera de `(main)`. Así no choca con su pie fijo de votación.
- **Alternativa descartada:** meter Temas y Personas en el menú hamburguesa. Se descarta porque la petición pide explícitamente un menú inferior.

### 3. Modelo de datos: `avatarUrl` y `bio` en `User`
- **Migración:** `ALTER TABLE users ADD COLUMN avatar_url text NULL, ADD COLUMN bio varchar(160) NULL`.
- **Índice:** `CREATE INDEX users_username_trgm_idx ON users USING gin (lower(username) gin_trgm_ops)`. La extensión `pg_trgm` ya existe.
- **Seed:**
  - Se añaden descripciones y fotos de demostración de `picsum.photos/seed/<username>/200`. Ese dominio ya está permitido en `next.config.ts`.
  - Al menos un usuario se queda sin foto ni descripción, para cubrir el respaldo.
  - Se añaden los usuarios necesarios para probar la paginación.
- **Imagen:** la foto se pinta con `next/image` (`sizes` fijo). El respaldo es un círculo con la inicial y un color derivado del `username`: un hash sencillo sobre una paleta fija que cumple el contraste con texto blanco.
- **Alternativa descartada:** no guardar foto ni descripción y usar solo la inicial. Se descarta porque la petición pide foto y descripción en el perfil; los campos opcionales permiten mostrarlas sin construir aún su edición.

### 4. `UserService.search` con keyset alfabético
- **Consulta:** SQL crudo como `TopicService`:
  ```sql
  SELECT u.id, u.username, u.avatar_url, (f.user_id IS NOT NULL) AS is_friend
  FROM users u
  LEFT JOIN friendships f ON f.user_id = ${viewerId} AND f.friend_id = u.id
  WHERE u.id <> ${viewerId} [AND lower(u.username) LIKE lower(${pattern}) ESCAPE '\']
    [AND (lower(u.username), u.id) > (${cursorName}, ${cursorId})]
  ORDER BY lower(u.username), u.id
  LIMIT 21
  ```
- **Cursor:** `[lowerUsername, id]` validado con Zod, reutilizando `encodeCursor` y `decodeCursor`.
- **Escape de la búsqueda:** `escapeLikePattern` se mueve de `topic-service.ts` a `src/server/sql.ts` para compartirlo.
- **Por qué este orden:** el alfabético es estable (no depende de contadores que cambian), así que no hacen falta deduplicaciones. En el cliente se mantiene la deduplicación por `id` de `TopicList` por uniformidad.
- **Alternativa descartada:** amigos primero. Se descarta porque obliga a un orden compuesto en el cursor y no se pidió.

### 5. Temas del perfil: `TopicService.listByAuthor`
- **Refactor de `queryPage`:** recibe un `Prisma.Sql` de filtro completo (visibilidad + título / autor) y un modo de orden.
  - `trending` y `top`: `total_votes DESC, created_at DESC, id DESC`, con el cursor actual de tres claves.
  - `recent`: `created_at DESC, id DESC`, con un cursor de dos claves (`[createdAt, id]`).
- **Signatura:** `listByAuthor({ authorId, viewerId, sort, cursor })`.
- **Visibilidad:** decide el filtro con la misma regla que `VisibilityPolicy`, sin evaluarla tema a tema:
  - Si `viewerId === authorId`, o si `FriendshipService.areFriends(authorId, viewerId)` es cierto, sin filtro.
  - En otro caso, `visibility = 'PUBLIC'`.
  - Para no duplicar la regla, se añade `VisibilityPolicy.canSeePrivateTopicsOf(authorId, viewerId)`, que reutiliza la misma lógica que `canAccess` (creador o amigo). Así la política sigue siendo el único punto de decisión.
- **Salida:** `TopicSummary` añade `visibility`, para que la tarjeta muestre «Privado». `TopicListItem` pinta la etiqueta solo cuando es `PRIVATE`; en tendencias y búsqueda nunca ocurre.
- **Índice:** existe `topics_author_id_idx`. Un autor tiene pocos temas, así que ordenar tras filtrar por autor es barato; no se añade un índice compuesto.
- **«Más puntuados» = votos totales:** es la misma métrica que muestra la tarjeta («N votos») y la que usa la tendencia (S-04).
  - Alternativa descartada: `positive_votes - negative_votes`. Se descarta por no ser visible en la tarjeta y por no tener índice.

### 6. `FriendshipService.add` / `remove`, idempotentes y simétricos
- **`add(userId, friendId)`:**
  - Valida que `userId !== friendId` (si no, `ValidationError` → 400) y que el usuario destino existe (si no, `NotFoundError` → 404).
  - Luego, en una transacción, hace `createMany({ data: [{userId, friendId}, {userId: friendId, friendId: userId}], skipDuplicates: true })`.
- **`remove`:** `deleteMany` con las dos combinaciones en una transacción, con las mismas validaciones.
- **Resultado:** ambos devuelven `{ isFriend }`.
- **Por qué es seguro ante concurrencia:** la idempotencia (`skipDuplicates` y `deleteMany`) hace inocuas las pulsaciones repetidas y las carreras entre los dos usuarios.
- **Endpoints:** `PUT` y `DELETE /api/users/[id]/friendship` (verbos idempotentes sobre el recurso «mi amistad con X») responden `200 { isFriend }`.
  - Alternativa descartada: `POST /api/friendships` con cuerpo. Se descarta por ser menos idempotente y menos REST para un booleano.

### 7. Perfil renderizado en servidor y actualización optimista
- **Carga inicial:** `src/app/(main)/personas/[id]/page.tsx` llama a `UserService.getProfile(id, viewerId)`, que devuelve `{ id, username, avatarUrl, bio, isFriend, isSelf }` o lanza `NotFoundError`. Si lo lanza, se llama a `notFound()` con un `not-found.tsx` propio. La página también llama a `TopicService.listByAuthor` para la primera página con `sort=recent`.
- **Cliente:** `ProfileScreen` recibe esos datos.
- **`FriendToggle`:**
  - Usa `useMutation` con estado optimista; si hay error, revierte y muestra un `role="alert"`.
  - Al terminar, invalida `["users"]` (lista de personas) y `["user-topics", id]`, para que aparezcan o desaparezcan los privados.
  - Botón con `aria-pressed`.
- **`SortSelector`:**
  - Control segmentado con dos `<button aria-pressed>` dentro de un `role="group"` con etiqueta «Ordenar temas».
  - El orden se guarda en estado local, no en la URL, para no repintar el servidor. La `queryKey` es `["user-topics", id, sort]`.
  - Solo la primera página de `recent` llega del servidor como `initialData`; `top` se pide al cambiar.
- **Pantalla Personas:** `page.tsx` renderiza en servidor la primera página de `UserService.search` según `?q=`, y `PeopleScreen` = `SearchBar` + `PeopleList`.
  - `SearchBar` se parametriza con `placeholder` y `ariaLabel` (por defecto los actuales).
  - `PeopleList` generaliza el patrón de `TopicList`. Se extrae un hook `useInfiniteList` para compartir el `IntersectionObserver` y la deduplicación, en vez de copiarlos.

### 8. Validación de entrada
- **Esquemas nuevos** en `src/lib/validation/users.ts`:
  - `listUsersQuerySchema`: `q` recortado de 1 a 100 caracteres (opcional) y `cursor`.
  - `userTopicsQuerySchema`: `sort` ∈ {`recent`, `top`}, por defecto `recent`, y `cursor`.
  - `userIdSchema`: UUID.
- **Errores:** un id mal formado se trata como 404 (igual que en temas) y un cursor inválido como 400.

## Risks / Trade-offs

- **[Añadir amigos sin consentimiento]** Cualquiera puede añadirte y ver así tus temas privados. → Es lo que se pide (check directo). Queda registrado como cuestión abierta Q-04 en `docs/01-producto.md` por si más adelante se quieren solicitudes con aceptación; el diseño (servicio + endpoint) permite añadir un estado pendiente sin romper la API.
- **[Exposición del listado de usuarios]** Cualquier usuario con sesión puede enumerar todos los nombres. → Solo se exponen `id`, `username`, `avatarUrl`, `bio` e `isFriend`, nunca el email. Es inherente a «buscar personas».
- **[Temas privados en el perfil]** Es un nuevo sitio donde un amigo ve privados, lo que amplía S-06. → Aplica exactamente la misma regla que `VisibilityPolicy`, centralizada en ella y cubierta por tests de integración con amigo, no amigo y creador.
- **[Consistencia tras quitar un amigo]** Una pantalla abierta puede mostrar un privado ya inaccesible. → Tras la mutación se invalidan las consultas del perfil. Además, abrir el tema devuelve 404 por la política, así que no hay fuga de datos.
- **[Solapamiento del menú inferior]** El menú fijo puede tapar contenido o el pie de otras pantallas. → El `padding-bottom` del `<main>` incluye la zona segura. La pantalla de tema está fuera de `(main)`. Se verifica a 375 px en claro y oscuro.
- **[Refactor de `queryPage`]** Puede romper tendencias y búsqueda. → Se mantienen intactos los tests de `topic-service.test.ts` y `descubrimiento-temas.spec.ts`, que deben seguir en verde sin cambios.

## Migration Plan

1. Migración Prisma `add_user_profile_and_username_search` (columnas nullable + índice trigram): compatible hacia atrás, sin rellenar datos.
2. Actualizar el seed y ejecutar `npm run db:seed` en local.
3. Desplegar backend y frontend juntos: no hay clientes externos de la API.
4. **Rollback:** revertir el código y ejecutar una migración inversa (`DROP INDEX`, `DROP COLUMN`). Las amistades creadas desde la aplicación son filas normales de `friendships` y siguen siendo válidas con el código anterior.

## Open Questions

- **Q-04:** ¿se necesitarán solicitudes de amistad con aceptación antes de pasar a producción? De momento no.
- **Edición del perfil:** la edición de la foto y de la descripción se deja para un cambio futuro. Hasta entonces, los usuarios registrados desde la aplicación se muestran con la inicial y sin descripción.
