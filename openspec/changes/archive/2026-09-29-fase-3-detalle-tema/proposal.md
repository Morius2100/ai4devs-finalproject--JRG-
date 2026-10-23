## Why

Al pulsar un tema, el usuario debe entrar en él y ver su título, la imagen adjunta en la mitad superior de la pantalla (si existe) y los dos botones de voto en la parte inferior (§5.2 de la definición del producto). Es la pantalla sobre la que se construye la votación.

## What Changes

- Política de visibilidad base (`VisibilityPolicy`) y obtención del detalle de un tema con el voto del usuario (TKT-016).
- Endpoint `GET /api/topics/:id` (TKT-016).
- Pantalla `/temas/[id]` con imagen opcional a media pantalla, título y botones 👍 verde / 👎 rojo; pantalla de "tema no encontrado" (TKT-017).
- Pruebas (TKT-018).

## Capabilities

### New Capabilities

- `detalle-tema`: presentación de un tema (título, imagen, botones de voto o resultados si ya votó) y respuesta ante temas inexistentes (HU-03).

### Modified Capabilities

<!-- Ninguna -->

## Impact

- Añade `VisibilityPolicy`, `TopicService.getById`, `src/app/api/topics/[id]/route.ts` y los componentes `TopicPage`, `TopicImage`, `VoteButtons`.
- `VoteButtons` queda visual en este cambio; su acción se implementa en la fase 4.
- La política de visibilidad se amplía con amigos en la fase 6.
