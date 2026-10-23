## Why

Hoy un usuario solo se entera de los temas nuevos de sus amigos si son privados (por notificación) o si visita su perfil. Los temas públicos recientes de un amigo se pierden entre las tendencias. Unas «historias» al estilo de Instagram en la pantalla de temas ponen a la vista, de un vistazo, lo que los amigos han creado en las últimas 24 horas y aún no se ha visto.

## What Changes

- **Burbujas de historias** en la pantalla de temas, entre el buscador y la lista (solo sin búsqueda activa):
  - una burbuja por amigo con algún tema pendiente, con su foto o inicial, un anillo de color de marca y su nombre;
  - si ese amigo tiene más de un tema pendiente, un contador;
  - ordenadas por el tema pendiente más reciente;
  - si no hay ninguna, la fila no se muestra.
- **Qué temas cuentan como pendientes**: los creados por un amigo actual (públicos o privados) en las últimas 24 horas que el usuario aún no ha abierto. Los propios nunca.
- **Pulsar una burbuja** abre el tema pendiente más antiguo de ese amigo. Al volver, la burbuja desaparece o pasa al siguiente tema pendiente.
- **Registro de temas visitados**: abrir la pantalla de un tema ajeno lo marca como visto, llegue el usuario desde donde llegue (lista, notificación, perfil o burbuja).
- **Modelo de datos**: nueva tabla `topic_views` (usuario, tema, fecha de la visita).
- **API**: nuevo `GET /api/stories`. `GET /api/topics/:id` registra la visita.
- **Datos semilla**: temas recientes de los amigos de «ana», con fecha relativa al momento de ejecutar el seed, para poder probar las historias.

## Capabilities

### New Capabilities
- `historias`: burbujas de temas nuevos de amigos (criterio de pendiente, orden, apertura y actualización) y registro de temas visitados.

### Modified Capabilities
<!-- Ninguna. `detalle-tema` no cambia su comportamiento visible; el registro de la visita se define en `historias`. -->

## Impact

- **Base de datos**: migración `add_topic_views` (tabla `topic_views` con clave primaria `(user_id, topic_id)` y borrado en cascada). `prisma/schema.prisma` y `prisma/seed.ts`.
- **Backend**:
  - `TopicService.getById` registra la visita;
  - nuevo `StoryService.listForUser`;
  - ruta `src/app/api/stories/route.ts`.
- **Frontend**:
  - nuevo `StoriesBar` en `HomeScreen`;
  - `TopicScreen` invalida la caché de historias al cargar un tema;
  - cliente `fetchStories` en `src/lib/api/`.
- **Documentación**:
  - `docs/01-producto.md` (nueva característica y funcionalidad);
  - `docs/02-arquitectura.md` (componentes, API y secuencia);
  - `docs/03-modelo-datos.md` (`topic_views`);
  - HU-19 en `docs/04-historias-usuario.md`;
  - tickets TKT-054 a TKT-058.
- **App Android**: funciona igual (pantallas de cliente y `apiFetch`). No hay rutas nuevas de pantalla.
