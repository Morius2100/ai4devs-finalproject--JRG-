## Context

- **Amistad simétrica** (dos filas por pareja en `friendships`). Decisión del usuario: se mantiene. Por eso «seguidos» y «seguidores» son la misma lista y se muestra una sola, «Amigos».
- `users.avatar_url` y `users.bio` (`VARCHAR(160)`) ya existen. Solo los rellena el seed; `docs/01-producto.md` deja fuera la edición del perfil (S-01, §1.7).
- **Componentes reutilizables**:
  - `ProfileHeader` (cabecera amarilla con `Avatar`, nombre y descripción);
  - `ProfileTopics` (temas de un autor con `SortSelector`, que con el propio usuario ya incluye los privados porque `VisibilityPolicy` deja al autor verlos);
  - `PersonListItem`;
  - `useInfiniteList`.
- **`UserService.search`**: lista alfabética keyset por `(lower(username), id)` con `is_friend` calculado mediante `LEFT JOIN friendships`.
- **`ImageStorage.upload(file)`** valida tamaño y tipo por _magic bytes_, pero fija la clave `topics/<uuid>.<ext>` (`s3-image-storage.ts`). `remove(key)` borra por clave.
- **`BottomNav`**: dos pestañas; `sectionFor(pathname)` decide la activa.
- **App Android**: rutas estáticas (sin `[id]`), datos por `apiFetch` y, tras cerrar sesión, se vacía la caché de TanStack Query.

## Goals / Non-Goals

**Goals:**
- Una pestaña Perfil con mis datos, contadores, amigos y temas, reutilizando los componentes del perfil de una persona.
- Editar la foto y la descripción de forma atómica (todo o nada) con la misma validación de imágenes que los temas.
- Que el cambio se vea en toda la aplicación sin recargar.

**Non-Goals:**
- Seguidores asimétricos, solicitudes de amistad o bloqueo (decisión del usuario: amistad simétrica).
- Cambiar el nombre de usuario, el email o la contraseña, o borrar la cuenta.
- Recortar o redimensionar la foto en el cliente. Se sube tal cual y se muestra con `object-cover`.
- Redirigir `/persona?id=<propio-id>` a `/perfil`. Esa vista de solo lectura sigue igual (`amistades`, «Propio perfil sin check»).

## Decisions

### D1. Rutas estáticas bajo `(main)`

`/perfil`, `/perfil/amigos` y `/perfil/editar` son páginas de cliente dentro del layout `(main)`, así que tienen `MainMenu`, `BottomNav` y `AuthGate`. Al no tener segmentos dinámicos entran en el export de la app sin cambios en el build móvil.

### D2. API `/api/me*` en lugar de `/api/users/:id`

- El cliente no necesita conocer su propio id: la sesión de la web no lo expone al cliente y en la app habría que guardarlo aparte del token. `/api/me` lo resuelve con `requireUser()`.
- `GET /api/me`: `UserService.getOwnProfile(userId)` devuelve el perfil más `topicsCount` (`COUNT(*) FROM topics WHERE author_id`) y `friendsCount` (`COUNT(*) FROM friendships WHERE user_id`).
- `GET /api/me/friends`: `UserService.listFriends({ userId, cursor })` reutiliza el constructor de consulta de `search` con `JOIN friendships` (en lugar de `LEFT JOIN`). Mismo orden, cursor y forma `PeoplePage` (`isFriend` siempre `true`). Se extrae la parte común de `search` a una función interna sin cambiar su comportamiento.
- Los temas propios se piden con el `GET /api/users/:id/topics` existente, usando el `id` de `GET /api/me`.

### D3. `PATCH /api/me` con `multipart/form-data`

- Validación con `updateProfileSchema` (Zod) en `src/lib/validation/users.ts`, compartida con el formulario:
  - `bio` opcional, recortada, de hasta 160 caracteres; `""` → `null`;
  - `removeAvatar` opcional, `"true"`;
  - error si llegan a la vez `avatar` y `removeAvatar`.
- Mismo límite previo de `Content-Length` (6 MB) que `POST /api/topics`.
- Orden de `UserService.updateProfile`:
  1. validar;
  2. si hay `avatar`, `imageStorage.upload(file, { prefix: "avatars" })`;
  3. `UPDATE users` con los campos presentes;
  4. si el `UPDATE` falla, borrar la imagen recién subida (mejor esfuerzo, como `createTopic`);
  5. si todo va bien y había una foto anterior propia del bucket (la URL empieza por `S3_PUBLIC_URL/`), borrarla (mejor esfuerzo).
- Así una imagen no válida (`413`/`415`) o una descripción larga (`400`) no cambian nada.
- `ImageStorage.upload(file, options?: { prefix?: "topics" | "avatars" })`, con `topics` por defecto para no tocar a quienes ya lo usan. `InMemoryImageStorage` aplica el mismo cambio.
- *Alternativa:* dos endpoints (`PUT /api/me/avatar` y `PATCH /api/me` en JSON). Descartada porque «Guardar» cambiaría la foto y la descripción en dos pasos no atómicos.

### D4. Interfaz

- **`MyProfileScreen`** (`/perfil`):
  - `useQuery(["me"], fetchMe)`;
  - `ProfileHeader`, que gana dos props opcionales: `stats` (los contadores, con el de amigos como `Link`) y `action` (el botón «Editar perfil»). El perfil de otra persona no las pasa y no cambia;
  - `ProfileTopics` con `userId = me.id`, que gana un `emptyMessage` opcional para «Todavía no has creado temas» con enlace a `/temas/nuevo`.
- **`MyFriendsScreen`** (`/perfil/amigos`): `useInfiniteList` con `fetchMyFriends` y `PersonListItem`, con estado vacío y enlace a Personas.
- **`EditProfileScreen`** (`/perfil/editar`):
  - formulario controlado; vista previa con `URL.createObjectURL`, liberada al desmontar;
  - `<input type="file" accept="image/jpeg,image/png,image/webp">`;
  - `<textarea maxLength={160}>` con contador «N caracteres restantes».
- **Al guardar**: `useMutation(updateMe)`; en `onSuccess` invalida `["me"]`, `["profile"]`, `["users"]` y `["stories"]`, y luego `router.push("/perfil")`. Los errores `413`/`415` se muestran junto a la foto y los `400` junto a su campo.
- **`FriendToggle`**: al cambiar la amistad invalida también `["me"]` y `["my-friends"]`, para que el contador y la lista cuadren al volver.

### D5. Tercera pestaña en `BottomNav`

- `Section` pasa a `"temas" | "personas" | "perfil"` y `sectionFor` devuelve `"perfil"` para `/perfil` y `/perfil/*` (admitiendo la barra final del build móvil).
- Pestaña con icono de usuario y texto «Perfil». Las tres son `flex-1`, con píldora activa y área mínima de 44 × 44 px; caben en 360 px con icono y texto.

## Risks / Trade-offs

- [Fotos grandes en conexiones móviles] → Límite de 5 MB como en los temas; `next/image` sin optimizar en la app. Redimensionar queda fuera de alcance.
- [Borrado de la foto anterior falla] → Mejor esfuerzo: queda un objeto huérfano en el bucket, sin efecto en la aplicación.
- [Selector de archivos en el WebView de Android] → El `BridgeWebChromeClient` de Capacitor atiende el `onShowFileChooser`. Se comprueba en el móvil (tarea de verificación).
- [Pestaña Perfil y perfil propio en `/persona?id=`] → Dos vistas del mismo perfil. Se mantiene la de Personas por coherencia con `amistades`.

## Migration Plan

Sin cambios de esquema. Se despliegan juntos backend y frontend. Los endpoints nuevos no afectan a los existentes.
