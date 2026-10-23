## Why

El usuario no tiene un sitio propio en la aplicación. Su foto y su descripción solo se pueden fijar con datos semilla (editar el perfil está hoy «fuera de alcance»). Para ver sus amigos tiene que ir buscando en Personas uno a uno, y para ver sus temas tiene que llegar a su perfil por URL. Una pestaña «Perfil», como en Instagram, reúne todo eso y permite editarlo.

## What Changes

- **Menú inferior con tres pestañas**: Temas, Personas y la nueva **Perfil** (`/perfil`), activa en todas las pantallas de mi perfil.
- **Pantalla Mi perfil (`/perfil`)**:
  - cabecera amarilla con mi foto (o inicial), nombre y descripción;
  - contadores «N temas» y «N amigos»; el de amigos abre la lista de amigos;
  - botón «Editar perfil»;
  - debajo, «Mis temas» con el selector «Más recientes / Más puntuados»; incluye los privados con su etiqueta «Privado», con la misma tarjeta que el perfil de una persona.
- **Lista de amigos (`/perfil/amigos`)**:
  - mis amigos en orden alfabético, con la tarjeta de Personas, enlazando a su perfil, y scroll infinito;
  - al ser la amistad simétrica (decisión del usuario), «seguidos» y «seguidores» son la misma lista y se muestra una sola, «Amigos».
- **Editar perfil (`/perfil/editar`)**:
  - cambiar la foto (JPEG, PNG o WebP de hasta 5 MB, con vista previa) o quitarla;
  - editar la descripción (hasta 160 caracteres, con contador);
  - al guardar, los cambios se ven en todas partes: mi perfil, Personas, el perfil que ven los demás y las historias.
- **API**:
  - `GET /api/me` (perfil propio con contadores);
  - `GET /api/me/friends?cursor=` (amigos paginados);
  - `PATCH /api/me` (`multipart/form-data` con `bio`, `avatar` y `removeAvatar`).
- **Almacenamiento**: las fotos de perfil se suben al mismo bucket con el prefijo `avatars/`. La foto anterior se borra (mejor esfuerzo).
- **Documentación**: editar la foto y la descripción pasa a estar dentro del alcance.

## Capabilities

### New Capabilities
- `mi-perfil`: pantalla de perfil propio (cabecera, contadores y temas propios), lista de amigos, edición de foto y descripción, y su API.

### Modified Capabilities
- `menu-inferior`: pasa de dos a tres pestañas (se añade Perfil) y la pestaña activa se amplía a las rutas `/perfil*`.

## Impact

- **Backend**:
  - `UserService.getOwnProfile`, `listFriends` y `updateProfile`;
  - `ImageStorage.upload` admite un prefijo de clave;
  - rutas `src/app/api/me/route.ts` y `src/app/api/me/friends/route.ts`;
  - validación `updateProfileSchema` en `src/lib/validation/users.ts`.
- **Frontend**:
  - `BottomNav` (tercera pestaña);
  - nuevas pantallas `src/app/(main)/perfil/page.tsx`, `perfil/amigos/page.tsx` y `perfil/editar/page.tsx`;
  - `ProfileHeader` gana contadores y una acción opcional;
  - reutiliza `ProfileTopics`, `PersonListItem` y `Avatar`;
  - clientes en `src/lib/api/me.ts`.
- **Datos**: sin cambios de esquema (`users.avatar_url` y `users.bio` ya existen).
- **Documentación**:
  - `docs/01-producto.md` (S-01, fuera de alcance y funcionalidad «Mi perfil»);
  - `docs/02-arquitectura.md` (componentes, API y rutas);
  - HU-20 y HU-21;
  - tickets TKT-059 a TKT-065.
- **App Android**: rutas estáticas compatibles con el export. El selector de archivos del WebView de Capacitor permite elegir la foto de la galería o la cámara (se comprueba en el móvil).
