## 1. Documentación

- [x] 1.1 Actualizar `docs/01-producto.md`: las tarjetas muestran la fecha de creación y marcan los temas ya votados, con su desglose (F-01) (TKT-050).
- [x] 1.2 Añadir a `docs/04-historias-usuario.md` la épica E9 · Tarjetas de tema con HU-17 (CA-17.1, CA-17.2) y HU-18 (CA-18.1–CA-18.4), y actualizar el resumen (TKT-050).
- [x] 1.3 Añadir los tickets TKT-050 a TKT-053 al resumen y al detalle de `docs/05-tickets.md` (TKT-050).
- [x] 1.4 Actualizar `docs/02-arquitectura.md` §2.5: `TopicSummary` con `myVote` y `results?` (solo si ha votado) en `GET /api/topics` y `GET /api/users/:id/topics` (TKT-050).
- [x] 1.5 Pruebas: `openspec validate tarjeta-tema-fecha-y-voto --strict` sin errores (TKT-050).

## 2. Backend: voto propio en los listados

- [x] 2.1 `queryPage` recibe `viewerId`, hace `LEFT JOIN votes v ON v.topic_id = t.id AND v.user_id = viewerId` y cualifica los filtros con el alias `t.` (TKT-051).
- [x] 2.2 `TopicSummary` gana `myVote: VoteValue | null` y `results?: { positiveVotes, negativeVotes }`, este último solo si `myVote` no es `null` (TKT-051).
- [x] 2.3 `listTrending` y `search` reciben `viewerId`. `GET /api/topics` lo pasa desde `requireUser()`. `listByAuthor` pasa el suyo a `queryPage` (TKT-051).
- [x] 2.4 Pruebas de integración en `tests/integration/topic-service.test.ts` y `user-topics.test.ts` (TKT-051):
  - tema votado a favor y en contra → `myVote` y `results` correctos;
  - tema no votado → `myVote: null` y sin `results`;
  - el voto de otro usuario no se filtra;
  - orden y paginación sin cambios.

## 3. Frontend: tarjeta con fecha y voto

- [x] 3.1 Crear `src/lib/format/relative-date.ts` con `formatRelativeDate(iso, now)` según las reglas del requisito «Fecha de creación en la tarjeta de tema» (TKT-052).
- [x] 3.2 En `TopicListItem`, añadir tras el chip de votos (TKT-052):
  - el chip de fecha con `<time dateTime>` y `aria-label` «Creado …»;
  - si hay `myVote`, el fondo y borde verde o rojo suave, los chips de desglose con `ThumbIcon` y `aria-label`, y el texto `sr-only` «Has votado a favor/en contra».
- [x] 3.3 En `TopicView` (`onSuccess` del voto), invalidar también `["user-topics"]` (TKT-052).
- [x] 3.4 Pruebas unitarias (TKT-052):
  - `formatRelativeDate`: ahora, minutos, horas, días, fecha del mismo año y de otro año, con `now` fijo;
  - `TopicListItem`: tarjeta votada a favor, en contra y no votada (fondo, desglose y etiqueta accesible);
  - actualizar `TopicList.test.tsx` y `ProfileScreen.test.tsx` con los nuevos campos.

## 4. Verificación

- [x] 4.1 Pruebas E2E en `tests/e2e/votacion.spec.ts`: tras votar un tema y volver a la lista, su tarjeta aparece marcada con el desglose; los temas no votados muestran solo el total y la fecha (TKT-053).
- [x] 4.2 Pruebas: `npm run lint`, `npm run typecheck`, `npm test` y `npm run test:e2e` sin fallos (TKT-053).
- [ ] 4.3 Pruebas: generar e instalar la app de desarrollo (`npm run build:mobile:dev`, `npm run android:apk`) y comprobar en el móvil la fecha y la marca de voto en tendencias y en un perfil (TKT-053).
