## Context

La tabla `friendships` existe desde la fase 1 (relación simétrica en dos filas, poblada por seed). `VisibilityPolicy` (fase 3) ya recibe `areFriends` inyectado, con valor `false`. Los temas privados ya pueden crearse (fase 5) pero solo los ve su creador.

## Goals / Non-Goals

**Goals:**

- Acceso a un tema privado para el creador y sus amigos, aplicado de forma idéntica en detalle, voto y opiniones.
- Una notificación por amigo al crear un tema privado, de forma atómica con la creación.
- Pantalla de notificaciones accesible desde el menú principal.

**Non-Goals:**

- Añadir, aceptar o eliminar amigos (Q-01).
- Notificaciones por email o push, marcar como leídas, contadores de no leídas (no especificados; S-07).
- Mostrar temas privados en tendencias o búsqueda (S-06).

## Decisions

- **`areFriends(authorId, viewerId)`** = `EXISTS` sobre la PK `(user_id, friend_id)` de `friendships`; al guardarse la relación en ambas direcciones basta una consulta.
- **La política se evalúa en el momento del acceso**, no se copia en el tema: si la relación de amistad cambia, el acceso cambia con ella.
- **Notificaciones en la misma transacción que el tema** (`INSERT … SELECT` desde `friendships`): o se crea el tema con todas sus notificaciones o nada. Se descarta una cola asíncrona: el número de amigos es acotado y no hay canales externos.
- **Modelo de notificación sin texto almacenado**: se guarda `actorId` + `topicId` y el texto "<usuario> ha creado una nueva propuesta: <título>" se compone al leer.
- **Temas privados inaccesibles → `404`** también desde la pantalla de notificaciones (si un tema dejara de ser accesible).
- **Listado de notificaciones**: más recientes primero, keyset `(created_at, id)`, página de 20; cada elemento enlaza a `/temas/[id]`.

## Risks / Trade-offs

- [Sin gestión de amigos, la funcionalidad solo se puede usar con amistades creadas por seed/administración] → Documentado como Q-01; el modelo y la política no cambian cuando se defina.
- [Usuarios con muchos amigos alargan la transacción de creación] → `INSERT … SELECT` en una sola sentencia; revisar si se superan miles de amigos.
