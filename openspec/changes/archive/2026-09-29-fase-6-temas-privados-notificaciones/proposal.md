## Why

Los temas privados solo tienen sentido si la lista de amigos del creador puede acceder a ellos y se entera de su existencia: solo los amigos del creador pueden acceder a la votación y reciben una notificación indicando que un amigo ha creado una nueva propuesta (§6.2 de la definición del producto).

## What Changes

- Servicio de amistades de solo lectura y ampliación de la política de visibilidad para dar acceso a los amigos del creador (TKT-028).
- Generación de una notificación por amigo al crear un tema privado, en la misma transacción (TKT-029).
- Endpoint `GET /api/notifications` (TKT-030).
- Opción "Notificaciones" en el menú principal y pantalla `/notificaciones` (TKT-031).
- Pruebas (TKT-032).

## Capabilities

### New Capabilities

- `temas-privados`: control de acceso a temas privados (creador y amigos del creador) en detalle, voto y opiniones (HU-11).
- `notificaciones`: aviso a los amigos del creador de un tema privado y pantalla para consultarlos (HU-12).

### Modified Capabilities

<!-- Ninguna: `detalle-tema` y `votacion` ya delegan el acceso en la política de visibilidad; este cambio amplía la política sin alterar sus requisitos. -->

## Impact

- Añade `FriendshipService`, `NotificationService`, `src/app/api/notifications/route.ts` y la página `/notificaciones`.
- Modifica `VisibilityPolicy` (inyección real de `areFriends`) y `TopicService.create` (transacción con notificaciones).
- Amplía el seed con un tema privado de `ana` y sus notificaciones.
- La gestión de la lista de amigos sigue fuera de alcance (cuestión abierta Q-01).
