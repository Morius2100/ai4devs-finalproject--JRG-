## 1. Bloques de voto

- [x] 1.1 Crear `src/components/topics/ThumbIcon.tsx`: SVG de trazo con `direction: "up" | "down"`, `currentColor`, tamaño configurable por `className` y `aria-hidden` (TKT-017)
- [x] 1.2 Rediseñar `src/components/topics/VoteButtons.tsx` como dos bloques `h-28 rounded-3xl`: verde (`bg-green-50 border-2 border-green-600 text-green-800`, relleno `green-600` con texto blanco en hover/active) y rojo con las mismas clases en `red-*`; `ThumbIcon` de 32 px sobre el texto "A favor" / "En contra"; se conservan `aria-label` y `onSelect`; pie fijo con `pb-[max(1rem,env(safe-area-inset-bottom))]` (TKT-017)
- [x] 1.3 Pruebas: test unitario de `VoteButtons` (muestra "A favor" y "En contra", las etiquetas accesibles y llama a `onSelect` con `UP`/`DOWN`), ejecutar `TopicView.test`, `JustificationDialog.test` y `tests/e2e/votacion.spec.ts`, y comprobar a 390 × 844 que los bloques miden ≥ 96 px y quedan abajo (escenarios "Tema aún no votado" y "Pulsar un bloque inicia el voto")

## 2. Bloques de resultados

- [x] 2.1 Rediseñar `src/components/topics/VoteResults.tsx` como rejilla de dos bloques `h-24 rounded-3xl`, no fija: porcentaje (`Math.round` para el positivo y `100 -` para el negativo), "N votos" / "1 voto" y "Tu voto" en el bloque propio; propio relleno (`bg-green-700` o `bg-red-600`, texto blanco) y el otro en tono claro (`bg-green-50` / `bg-red-50`, texto `-800`); `h2` oculto "Resultados" y `ThumbIcon` en cada bloque (TKT-022)
- [x] 2.2 Reordenar `src/components/topics/TopicView.tsx`: título → `VoteResults` (si ha votado) → `OpinionList` en el relleno flexible → `VoteButtons` fijo abajo (si no ha votado), sin cambiar la lógica de la mutación ni del diálogo (TKT-021, TKT-022)
- [x] 2.3 Sustituir los emojis de `src/components/topics/OpinionItem.tsx` por `ThumbIcon`, conservando `border-green-600` / `border-red-600` (TKT-022)
- [x] 2.4 Pruebas: test unitario de `VoteResults` (5/2 con voto UP da "71 %", "29 %", "5 votos", "2 votos" y "Tu voto" en el verde; 0/1 con voto DOWN da "100 %", "0 %", "1 voto"), actualizar `TopicView.test` para buscar "5 votos" y "2 votos", y ejecutar `OpinionItem.test` y el e2e de votación (escenarios "Resultados con voto positivo propio", "Un único voto" y "Opiniones bajo los resultados")

## 3. Verificación final

- [x] 3.1 Ejecutar `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test` y `npm run test:e2e` sin errores (TKT-009)
- [x] 3.2 Pruebas: revisión visual con la app en marcha a 375 × 812 en modo claro y oscuro, en un tema con imagen, un tema sin imagen, antes y después de votar y con el diálogo abierto, comprobando que la imagen sigue midiendo la mitad de la pantalla (requisitos de `detalle-tema` e `identidad-visual`) (TKT-017)
