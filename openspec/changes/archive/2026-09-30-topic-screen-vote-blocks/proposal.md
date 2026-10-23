## Why

Tras el rediseño `glovo-frontend-redesign`, la pantalla principal tiene una identidad visual clara, pero la pantalla de un tema sigue siendo la parte más pobre: dos píldoras con un emoji como único contenido, sin texto, y unos resultados que se reducen a dos números y una barra. Es la pantalla donde ocurre la acción central de Opina (votar) y debe ser la más clara y cómoda de usar con el pulgar. De las cinco propuestas presentadas, se ha elegido el diseño 3, "Bloques grandes".

## What Changes

- Los dos botones de voto pasan a ser dos **bloques grandes** (≈ 112 px de alto) en la parte inferior, con icono de pulgar y texto visible ("A favor" / "En contra"): verde a la izquierda y rojo a la derecha.
- Tras votar, los bloques se sustituyen por **bloques de resultados** situados bajo el título: cada uno muestra el porcentaje y el número de votos de su lado. El bloque del voto propio aparece relleno de color con la etiqueta "Tu voto"; el otro, en tono claro.
- Las opiniones se muestran debajo de los bloques de resultados, con scroll.
- Los emojis 👍/👎 se sustituyen por iconos SVG en línea que heredan el color.
- El pie de voto respeta el área segura inferior de los móviles con barra de gestos.
- No cambian el flujo de voto, el diálogo de justificación, la API ni los datos.

## Capabilities

### New Capabilities
<!-- Ninguna. -->

### Modified Capabilities
- `identidad-visual`: se añaden los requisitos visuales de los bloques de voto y de los bloques de resultados de la pantalla de un tema. Los requisitos existentes de `detalle-tema` y `votacion` (botones verde y rojo abajo, resultados con ambos totales en lugar de los botones, totales ocultos antes de votar) se cumplen sin cambios.

## Impact

- **Código afectado**: `src/components/topics/VoteButtons.tsx`, `src/components/topics/VoteResults.tsx`, `src/components/topics/TopicView.tsx` y un componente nuevo de iconos de pulgar en `src/components/topics/`.
- **Tests**: los tests que localizan los botones por su etiqueta accesible ("Votar a favor", "Votar en contra") siguen valiendo. El e2e que comprueba que los botones quedan en la parte inferior se revisa, y se añaden tests unitarios de los bloques de resultados.
- **API, servicios y base de datos**: sin cambios.
