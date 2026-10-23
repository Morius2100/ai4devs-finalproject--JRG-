## 1. Documentación

- [x] 1.1 Actualizar `docs/01-producto.md` (TKT-059):
  - S-01: perfil editable (foto y descripción);
  - quitar «edición del perfil de usuario» de §1.7;
  - nueva funcionalidad «Mi perfil»: pestaña, contadores, amigos, temas propios y edición;
  - menú inferior con tres secciones;
  - nota: con amistad simétrica, seguidos y seguidores son la misma lista, «Amigos».
- [x] 1.2 Añadir a `docs/04-historias-usuario.md` la épica E11 · Mi perfil con HU-20 «Editar mi foto y descripción» (CA-20.1–CA-20.4) y HU-21 «Ver mi perfil, mis amigos y mis temas» (CA-21.1–CA-21.3), y actualizar el resumen (TKT-059).
- [x] 1.3 Añadir los tickets TKT-059 a TKT-065 al resumen y al detalle de `docs/05-tickets.md` (TKT-059).
- [x] 1.4 Actualizar `docs/02-arquitectura.md` (TKT-059):
  - pantallas `/perfil`, `/perfil/amigos` y `/perfil/editar`;
  - `GET /api/me`, `GET /api/me/friends` y `PATCH /api/me`;
  - prefijo `avatars/` en el almacenamiento;
  - estructura de carpetas.
- [x] 1.5 Pruebas: `openspec validate mi-perfil --strict` sin errores (TKT-059).

## 2. Backend: lectura del perfil propio

- [x] 2.1 Extraer de `UserService.search` la construcción de la consulta y añadir `UserService.listFriends({ userId, cursor })` con `JOIN friendships`, sin cambiar `search` (TKT-060).
- [x] 2.2 Añadir `UserService.getOwnProfile(userId)` con `topicsCount` (incluye privados) y `friendsCount` (TKT-060).
- [x] 2.3 Crear `GET /api/me` en `src/app/api/me/route.ts` y `GET /api/me/friends` en `src/app/api/me/friends/route.ts`, validando `cursor` (TKT-060).
- [x] 2.4 Pruebas de integración en `tests/integration/me.test.ts` (TKT-060):
  - contadores correctos (con un tema privado);
  - sin email;
  - amigos en orden alfabético, paginados de 20 y solo amigos;
  - `401` sin sesión.

## 3. Backend: edición del perfil

- [x] 3.1 `ImageStorage.upload(file, { prefix })` con `topics` por defecto, en `S3ImageStorage` e `InMemoryImageStorage` (TKT-061).
- [x] 3.2 Añadir `updateProfileSchema` a `src/lib/validation/users.ts`: `bio` recortada ≤ 160 y `""` → `null`; `removeAvatar`; `avatar` y `removeAvatar` a la vez es un error (TKT-061).
- [x] 3.3 Implementar `UserService.updateProfile` en el orden de D3 (TKT-061):
  - validar;
  - subir la foto;
  - `UPDATE`;
  - si el `UPDATE` falla, borrar la foto nueva;
  - si todo va bien, borrar la foto anterior del bucket.
- [x] 3.4 Añadir `PATCH` a `src/app/api/me/route.ts`: límite de `Content-Length` de 6 MB, `multipart/form-data`, respuesta `200` con el perfil (TKT-061).
- [x] 3.5 Pruebas de integración con `IMAGE_STORAGE=memory` (TKT-061):
  - solo descripción;
  - descripción vacía → `null`;
  - más de 160 caracteres → `400` sin cambios;
  - foto PNG válida → URL `avatars/…` y anterior borrada;
  - GIF → `415` y 6 MB → `413`, sin cambios en foto ni descripción;
  - `removeAvatar`;
  - `avatar` con `removeAvatar` → `400`.

## 4. Frontend: pestaña y pantalla Mi perfil

- [x] 4.1 Añadir en `src/lib/api/me.ts` los clientes `fetchMe`, `fetchMyFriends` y `updateMe` con `apiFetch` (TKT-062).
- [x] 4.2 Añadir la tercera pestaña «Perfil» a `BottomNav`, con icono de usuario y `sectionFor` para `/perfil*` (admitiendo barra final) (TKT-062).
- [x] 4.3 `ProfileHeader` gana `stats` y `action` opcionales; `ProfileTopics` gana `emptyMessage` opcional (TKT-062).
- [x] 4.4 Crear `src/app/(main)/perfil/page.tsx` con `MyProfileScreen`: cabecera, contadores (amigos como enlace), «Editar perfil» y «Mis temas» con estado vacío y enlace a crear tema (TKT-062).
- [x] 4.5 Pruebas unitarias (TKT-062):
  - `BottomNav` con tres pestañas y activa en `/perfil`, `/perfil/amigos`, `/perfil/editar` y `/perfil/`;
  - `MyProfileScreen` con perfil completo, sin foto ni descripción, contadores en singular y plural, y sin temas.

## 5. Frontend: lista de amigos

- [x] 5.1 Crear `src/app/(main)/perfil/amigos/page.tsx` con `MyFriendsScreen`: título «Amigos», `useInfiniteList` con `fetchMyFriends`, `PersonListItem` y estado vacío con enlace a Personas (TKT-063).
- [x] 5.2 `FriendToggle` invalida también `["me"]` y `["my-friends"]` al cambiar la amistad (TKT-063).
- [x] 5.3 Pruebas unitarias de `MyFriendsScreen` (TKT-063):
  - lista en orden;
  - enlaces a `/persona?id=`;
  - vacía;
  - centinela de scroll solo con `nextCursor`.

## 6. Frontend: editar perfil

- [x] 6.1 Crear `src/app/(main)/perfil/editar/page.tsx` con `EditProfileScreen` (TKT-064):
  - foto actual con vista previa, «Cambiar foto» y «Quitar foto»;
  - descripción con `maxLength` 160 y contador;
  - «Guardar» y «Cancelar».
- [x] 6.2 Al guardar, invalidar `["me"]`, `["profile"]`, `["users"]` y `["stories"]` y volver a `/perfil`. Mostrar los errores `400`, `413` y `415` junto a su campo sin perder lo escrito (TKT-064).
- [x] 6.3 Pruebas unitarias de `EditProfileScreen` (TKT-064):
  - vista previa al elegir archivo;
  - contador de caracteres;
  - «Quitar foto» solo con foto;
  - error `415` junto a la foto;
  - «Cancelar» vuelve sin llamar a la API.

## 7. Verificación

- [x] 7.1 Pruebas E2E en `tests/e2e/mi-perfil.spec.ts` (TKT-065):
  - la pestaña Perfil muestra datos y contadores;
  - editar la descripción y subir una foto (fixture `topic-image.png`) se ve en `/perfil` y en el perfil que ve otro usuario;
  - la lista de amigos abre un perfil;
  - quitar un amigo actualiza lista y contador;
  - «Mis temas» incluye el privado.
- [x] 7.2 Actualizar las pruebas E2E y unitarias que asumen dos pestañas en el menú inferior (TKT-065).
- [x] 7.3 Pruebas: `npm run lint`, `npm run typecheck`, `npm test` y `npm run test:e2e` sin fallos (TKT-065).
- [ ] 7.4 Pruebas: generar e instalar la app de desarrollo y comprobar en el móvil la pestaña Perfil, la lista de amigos y el cambio de foto desde la galería y desde la cámara (TKT-065).
