## Why

Las tarjetas de tema solo muestran título, miniatura y total de votos. El usuario no sabe si un tema es reciente ni si ya lo ha votado, así que tiene que abrirlo para comprobarlo. Los temas ya guardan su fecha de creación (`topics.created_at`) y el voto de cada usuario (`votes`), pero ninguno de los dos datos llega a la tarjeta.

## What Changes

- **Fecha de creación visible en cada tarjeta**, justo al lado del chip de votos:
  - formato relativo corto para lo reciente («ahora», «hace 5 min», «hace 3 h», «hace 2 d»);
  - fecha corta a partir de 7 días («12 sept», o «12 sept 2025» si es de otro año).
- **Tarjeta de un tema ya votado**:
  - fondo verde suave si el usuario votó a favor, rojo suave si votó en contra;
  - junto al chip de votos, los votos a favor y en contra con su icono de pulgar;
  - una etiqueta accesible indica el voto propio, para no depender solo del color.
- **Sin cambios para los temas no votados**: siguen sin mostrar el desglose a favor/en contra (supuesto S-03).
- **Aplica a todas las listas que usan la tarjeta**: tendencias, búsqueda y temas del perfil de una persona.
- **API de listados** (`GET /api/topics` y `GET /api/users/:id/topics`): cada `TopicSummary` incluye `myVote`, y `results` (votos a favor y en contra) solo si el usuario ha votado.
- **Tras votar**, las listas se actualizan para que la tarjeta aparezca marcada al volver.

## Capabilities

### New Capabilities
<!-- Ninguna. -->

### Modified Capabilities
- `identidad-visual`: nuevos requisitos «Fecha de creación en la tarjeta de tema» y «Tarjeta de un tema ya votado».

## Impact

- **Backend:**
  - `TopicService.queryPage`, `listTrending`, `search` y `listByAuthor` reciben el `viewerId` y hacen `LEFT JOIN` con `votes`;
  - `TopicSummary` gana `myVote` y `results?`;
  - rutas `GET /api/topics` y `GET /api/users/[id]/topics`.
- **Frontend:**
  - `TopicListItem`;
  - nueva utilidad de fecha relativa en `src/lib/format/`;
  - `TopicView` invalida también la caché de los temas del perfil al votar.
- **Contrato de la API:** cambio compatible (campos añadidos). Se documenta en `docs/02-arquitectura.md` §2.5.
- **Documentación:** historias HU-17 y HU-18 en `docs/04-historias-usuario.md`, tickets TKT-050 a TKT-053 y funcionalidad en `docs/01-producto.md`.
- **App Android:** sin cambios específicos; la tarjeta es la misma.
