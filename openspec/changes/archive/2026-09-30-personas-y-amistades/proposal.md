## Why

Los temas privados dependen de la lista de amigos del creador, pero hoy la aplicación no ofrece ninguna forma de formarla: la relación de amistad solo se crea con datos semilla o administración directa (cuestión abierta Q-01 de `docs/01-producto.md`). Un usuario recién registrado no puede tener amigos, así que nadie ve ni vota sus temas privados. Este cambio resuelve Q-01: permite encontrar a otras personas, ver su perfil y sus temas, y añadirlas o quitarlas de amigos. Además, da acceso directo a estas funciones mediante un menú inferior con dos secciones: Temas y Personas.

## What Changes

- **Menú inferior** fijo en las pantallas principales con dos pestañas, **Temas** y **Personas**. Temas es la pantalla por defecto (la pantalla principal actual). El menú usa el fondo amarillo de marca con la pestaña activa en una píldora blanca. Es el único elemento que se toma del diseño "C · Cuadrícula"; el resto sigue el diseño "A · Clásico" de `docs/mockups/personas-disenos.html`.
- **Pantalla Personas** (`/personas`):
  - Buscador igual que el de temas: píldora sobre fondo amarillo, con debounce y sincronizado con `?q=`.
  - Lista de tarjetas con scroll infinito. Cada tarjeta muestra la foto de perfil (o la inicial si no hay foto), el nombre de usuario y una etiqueta «Amigo» / «No amigo».
  - El buscador filtra la lista por nombre de usuario. El propio usuario no aparece en ella.
- **Pantalla Perfil** (`/personas/[id]`), que se abre al pulsar una persona:
  - Cabecera amarilla con la foto de perfil, el nombre y una breve descripción.
  - Debajo, un botón de check para añadir o quitar a la persona de amigos.
  - Después, los temas que ha creado. Encima de ellos, un selector de orden: «Más recientes» (fecha de creación descendente) o «Más puntuados» (votos totales descendente).
- **Añadir y quitar amigos** de forma directa, sin solicitud ni aceptación. La amistad es simétrica: se crean o se borran las dos filas a la vez. Al quitar a un amigo, cada uno pierde de inmediato el acceso a los temas privados del otro.
- **Temas del perfil según la visibilidad actual**: los públicos siempre. Los privados solo si quien mira es amigo o el propio creador; se marcan con la etiqueta «Privado».
- **Perfil mínimo en el modelo de datos**: `User` gana `avatarUrl` y `bio`, ambos opcionales. Los datos semilla los rellenan. Editar el propio perfil y subir la foto quedan fuera de este cambio.
- **API nueva**:
  - `GET /api/users` para listar y buscar personas.
  - `GET /api/users/[id]/topics` para los temas de una persona, con los órdenes `recent` y `top`.
  - `PUT /api/users/[id]/friendship` para añadir a un amigo y `DELETE /api/users/[id]/friendship` para quitarlo.
- **Documentación**:
  - `docs/01-producto.md`: se cierra Q-01 y se ajustan S-01, S-02 y el apartado «Fuera de alcance».
  - `docs/04-historias-usuario.md`: nuevas historias HU-13 a HU-15 (épica E7 · Personas).
  - `docs/05-tickets.md`: nuevos tickets TKT-033 a TKT-040.
  - `docs/02-arquitectura.md` y `docs/03-modelo-datos.md`: se actualizan.

## Capabilities

### New Capabilities
- `menu-inferior`: navegación inferior persistente entre las secciones Temas (por defecto) y Personas, con su aspecto y su estado activo.
- `personas`: listado y búsqueda de personas con el indicador de amistad, y la pantalla de perfil (foto, nombre, descripción y temas creados con dos órdenes).
- `amistades`: añadir y quitar amigos desde el perfil, con relación simétrica e inmediata, y su efecto sobre el acceso a los temas privados.

### Modified Capabilities
<!-- Ninguna. La política de acceso a temas privados (`temas-privados`) y la exclusión de privados en tendencias y búsqueda (`descubrimiento-temas`) no cambian: el perfil aplica la misma política. -->

## Impact

- **Base de datos**: una migración que añade `users.avatar_url` (nullable) y `users.bio` (nullable, máximo 160 caracteres), y un índice trigram sobre `lower(username)`. `prisma/seed.ts` se actualiza con descripciones y más usuarios.
- **Servicios**:
  - Nuevo `UserService`, con `search` y `getProfile`.
  - `FriendshipService` gana `add` y `remove`.
  - `TopicService` gana `listByAuthor`, y `queryPage` se generaliza para aceptar un filtro de visibilidad y autor.
- **API**: cuatro endpoints nuevos bajo `/api/users`, todos con sesión obligatoria.
- **Frontend**:
  - Nuevo `BottomNav` en `src/app/(main)/layout.tsx`.
  - Nuevas rutas `src/app/(main)/personas/page.tsx` y `src/app/(main)/personas/[id]/page.tsx`.
  - Nuevos componentes en `src/components/people/`.
  - `SearchBar` se parametriza (texto de ayuda y etiqueta accesible) para reutilizarlo.
- **Tests**:
  - Unitarios y de integración de los servicios y endpoints nuevos.
  - Unitarios de los componentes.
  - Un e2e del flujo buscar persona → abrir perfil → añadir amigo → ver su tema privado → quitar amigo.
- **Dependencias**: ninguna nueva.
