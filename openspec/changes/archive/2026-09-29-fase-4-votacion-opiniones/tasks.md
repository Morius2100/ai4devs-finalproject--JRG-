## 1. Emisión de voto (TKT-019)

- [x] 1.1 Esquema Zod `castVoteSchema` (`value: "UP" | "DOWN"`, `justification` opcional, `trim`, ≤ 500, vacía → `null`) en `src/lib/validation/vote.ts`
- [x] 1.2 Implementar `VoteService.castVote(topicId, userId, value, justification)` en una transacción: `VisibilityPolicy` → insert → incremento de contadores; `P2002` → `ConflictError`
- [x] 1.3 Implementar `POST /api/topics/:id/votes` que responde `201 { positiveVotes, negativeVotes, myVote }`

## 2. Opiniones (TKT-020)

- [x] 2.1 Implementar `VoteService.listOpinions(topicId, viewerId, cursor)`: comprueba acceso (`404`) y voto previo (`ForbiddenError`), filtra `justification IS NOT NULL`, orden `createdAt DESC, id DESC`, keyset 20, incluye `username`
- [x] 2.2 Implementar `GET /api/topics/:id/opinions`

## 3. Flujo de voto en la UI (TKT-021)

- [x] 3.1 Crear `JustificationDialog` accesible (`role="dialog"`, foco atrapado, `Esc` cancela) con `textarea` opcional y contador 0/500, botones "Cancelar" y "Votar"
- [x] 3.2 Conectar `VoteButtons.onSelect` para abrir el diálogo con el valor elegido
- [x] 3.3 Al confirmar: mutación con TanStack Query, botón deshabilitado durante la petición, `409` tratado como ya votado (recargar tema), errores de validación mostrados en el diálogo

## 4. Resultados y opiniones (TKT-022)

- [x] 4.1 Crear `VoteResults` con los totales 👍 (verde) y 👎 (rojo) y sustituir `VoteButtons` tras el voto sin recargar
- [x] 4.2 Crear `OpinionItem` (verde para `UP`, rojo para `DOWN`, icono, nombre de usuario y justificación)
- [x] 4.3 Crear `OpinionList` con `useInfiniteQuery`, scroll continuo y estado "Aún no hay opiniones"
- [x] 4.4 Sustituir el contenedor provisional de resultados de `TopicPage` por `VoteResults` e invalidar las cachés del tema y de tendencias tras votar

## 5. Pruebas (TKT-023)

- [x] 5.1 Integración de `VoteService.castVote`: voto positivo/negativo, justificación vacía/espacios/501 caracteres, segundo voto `409`, dos votos concurrentes → un único incremento, tema sin acceso `404`
- [x] 5.2 Integración de `listOpinions`: solo con justificación, orden, paginación de 30, `403` sin voto
- [x] 5.3 Tests de componente: `JustificationDialog` (cancelar, confirmar vacío, límite), `OpinionItem` (colores)
- [x] 5.4 E2E: votar positivo con justificación → totales y opinión verde; votar negativo sin justificación → totales sin nueva opinión; reentrar en el tema → se ven resultados, no botones
