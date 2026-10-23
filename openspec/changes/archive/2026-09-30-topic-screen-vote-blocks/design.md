## Context

La pantalla de un tema (`/temas/[id]`) se compone en `TopicView`: imagen opcional a media pantalla (`TopicImage`, `h-[50dvh]`), hoja blanca con el título que solapa 16 px la imagen, un relleno flexible con `OpinionList` (solo tras votar) y, al pie, `VoteButtons` (no votado) o `VoteResults` (votado), ambos `sticky bottom-0`. Tras `glovo-frontend-redesign`:

- `VoteButtons` son dos píldoras de 64 px con un emoji como único contenido.
- `VoteResults` es una fila con "👍 N" / "👎 N" y una barra de proporción, fija abajo.

Restricciones de las specs vigentes: imagen a media pantalla (`detalle-tema`), botones verde y rojo abajo con etiqueta accesible (`detalle-tema`), resultados con ambos totales en lugar de los botones y sin recargar (`votacion`), totales ocultos antes de votar (S-03), y verde/rojo acompañado de icono o texto (`identidad-visual`).

Referencia: diseño 3, "Bloques grandes", de las cinco propuestas presentadas.

## Goals / Non-Goals

**Goals:**
- Bloques de voto grandes y con texto, cómodos de pulsar con el pulgar.
- Resultados comprensibles de un vistazo (porcentaje y votos por lado, voto propio destacado) en el mismo lenguaje visual que los bloques de voto.
- Mantener intactos el flujo de voto, las etiquetas accesibles y los contratos de las specs.

**Non-Goals:**
- Cambiar el diálogo de justificación, la lista de opiniones (más allá de su posición), la API o los datos.
- Mostrar totales o porcentajes antes de votar.
- Añadir navegación (botón "volver") o cabecera a la pantalla del tema.

## Decisions

### 1. Bloques de voto en tono claro con borde, relleno al pulsar
Cada bloque es un `button` de `h-28` (112 px), `rounded-3xl`, icono de 32 px sobre el texto en negrita. El verde usa `bg-green-50`, `border-2 border-green-600` y texto `text-green-800`, y se rellena (`bg-green-600`, texto blanco) en `hover` y `active`. El rojo usa las mismas clases con `red-*`. Se mantienen `aria-label="Votar a favor"` / `"Votar en contra"`.
- *Por qué*: es fiel al diseño elegido y deja el color sólido para el estado "Tu voto" de los resultados, de modo que "votado" y "sin votar" se distinguen de un vistazo. El texto `green-800` sobre `green-50` da ≈ 7:1.
- *Alternativa descartada*: bloques de color sólido desde el principio. Son más ruidosos y el voto propio no destacaría en los resultados.

### 2. Iconos de pulgar como SVG en línea
Se crea `src/components/topics/ThumbIcon.tsx` con `direction: "up" | "down"`, un SVG de trazo que usa `currentColor` y lleva `aria-hidden`. Sustituye a los emojis en bloques, resultados y opiniones.
- *Por qué*: los emojis cambian de aspecto según el sistema y no heredan color. No hace falta añadir una librería de iconos por dos glifos.
- *Aviso*: el SVG debe llevar `aria-hidden`, porque `TopicView.test` comprueba que un tema sin imagen no renderiza ningún elemento con rol `img`.

### 3. Resultados como dos bloques bajo el título, no fijos
`VoteResults` pasa a una rejilla de dos bloques de `h-24` situada justo después del título, dentro del flujo normal (sin `sticky`), con las opiniones debajo. Cada bloque muestra el porcentaje (`text-3xl font-extrabold`), "N votos" / "1 voto" y, si es el voto propio, la etiqueta "Tu voto". El propio se rellena (`bg-green-700` o `bg-red-600`, texto blanco) y el otro queda en tono claro (`bg-green-50` / `bg-red-50` con texto `-800`). El bloque lleva un `h2` oculto "Resultados" para lectores de pantalla.
- *Por qué*: con el pie fijo, los resultados y las opiniones competirían por el espacio. Arriba se leen primero y las opiniones pueden ocupar el resto con scroll natural. `green-700` en lugar de `green-600` hace que el texto blanco pase de 3.3:1 a ≈ 5:1.
- *Porcentajes*: se calcula `positivo = Math.round(pos / total * 100)` y `negativo = 100 - positivo`, para que la suma sea siempre 100. Tras votar `total ≥ 1`, así que no hay división entre cero.

### 4. Composición de `TopicView`
La hoja bajo la imagen queda: título → `VoteResults` (si ha votado) → `OpinionList` (si ha votado) en el relleno flexible → `VoteButtons` fijo abajo (si no ha votado). El pie de voto añade `pb-[max(1rem,env(safe-area-inset-bottom))]`.

## Risks / Trade-offs

- [El e2e de "botones abajo" mide la distancia al borde inferior] → Los bloques siguen fijos abajo con 16 px de margen, dentro de la tolerancia de 24 px que ya tiene el test. Se vuelve a ejecutar.
- [`TopicView.test` busca los totales con `getByText(/5/)` y `getByText(/2/)`, que ahora encontrarían varias coincidencias ("29 %", "2 votos")] → Se actualiza el test para buscar "5 votos" y "2 votos".
- [Resultados arriba y no en el sitio de los botones: la transformación es menos literal] → Los bloques de voto desaparecen del pie y aparecen los de resultados con la misma forma y colores. La spec `votacion` exige sustituirlos sin recargar, no que ocupen la misma posición.
- [Bloques de 112 px en pantallas bajas (≈ 640 px) reducen el espacio del título] → La imagen ocupa el 50 %, el pie ≈ 140 px y el título ≈ 180 px, suficiente para títulos de hasta 120 caracteres en dos o tres líneas.

## Migration Plan

Cambio solo de presentación, desplegable en un paso. Reversión: revertir los componentes afectados.

## Open Questions

- Ninguna bloqueante.
