## Context

- `TopicSummary` (`src/server/services/topic-service.ts`) ya incluye `createdAt` (ISO), pero `TopicListItem` no lo muestra.
- `queryPage(filter, order, cursor)` hace un `SELECT` sobre `topics` sin saber quién mira. `listTrending()` y `search()` no reciben el usuario, aunque la ruta sí lo conoce (`requireUser()`). `listByAuthor()` sí recibe `viewerId`.
- `topics` guarda contadores desnormalizados (`positive_votes`, `negative_votes`, `total_votes`). `votes` tiene `UNIQUE (topic_id, user_id)`, que sirve de índice para el `JOIN` por usuario.
- Supuesto S-03 (`detalle-tema`): no se devuelven los totales a favor y en contra a quien no ha votado.
- `TopicView` invalida `["topics"]` al votar, pero no `["user-topics"]`, que es la caché de los temas del perfil.
- Colores del voto: `VoteResults` usa `green-50/700` y `red-50/600` de Tailwind con variantes `dark:`.
- La interfaz también se exporta a la app Android: todo el trabajo de formato se hace en el cliente.

## Goals / Non-Goals

**Goals:**
- Fecha de creación y estado de voto en la tarjeta, con una sola consulta por página (sin N+1).
- Respetar S-03 en los listados, igual que en el detalle.
- Tarjeta idéntica en tendencias, búsqueda y perfil.

**Non-Goals:**
- Cambiar el orden o el contenido de las listas.
- Mostrar el voto de otros usuarios o marcar temas visitados sin votar (eso lo cubre `historias-amigos`).
- Actualizar la fecha relativa en vivo mientras la pantalla está abierta. Se recalcula al volver a pintar la lista.

## Decisions

### D1. `LEFT JOIN votes` en `queryPage`

`queryPage` recibe `viewerId` y ejecuta:

```sql
SELECT t.id, t.title, t.image_url, t.visibility, t.total_votes, t.created_at,
       t.positive_votes, t.negative_votes, v.value AS my_vote
FROM topics t
LEFT JOIN votes v ON v.topic_id = t.id AND v.user_id = ${viewerId}::uuid
WHERE …
```

- El `JOIN` usa el índice único `(topic_id, user_id)` y es una sola consulta por página.
- `listTrending({ viewerId, cursor })` y `search({ viewerId, q, cursor })` pasan a recibir `viewerId`, y la ruta `GET /api/topics` lo pasa.
- Los filtros y el `ORDER BY` se cualifican con el alias `t.`. El cursor no cambia.
- `toSummary` añade `myVote` y, solo si no es `null`, `results: { positiveVotes, negativeVotes }`, con la misma forma que `TopicDetail`.
- *Alternativa:* una segunda consulta `votes WHERE topic_id IN (…)`. Descartada porque añade un viaje a la base de datos por página sin ninguna ventaja.

### D2. Formato de fecha en el cliente

- `src/lib/format/relative-date.ts` exporta `formatRelativeDate(iso, now = new Date())`, una función pura con las reglas del requisito.
- La fecha absoluta usa `Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" })` y añade el año si difiere.
- En los navegadores actuales, `es-ES` abrevia septiembre como «sept». La prueba unitaria fija el resultado esperado del entorno.
- `now` es inyectable para que las pruebas sean deterministas.
- *Alternativa:* `Intl.RelativeTimeFormat`. Descartada porque produce «hace 3 horas», más largo que el chip corto pedido, y no ofrece «ahora».
- Las pantallas se pintan solo en el cliente (sin SSR de datos desde `app-movil-empaquetada`), así que no hay desajuste de hidratación por la hora.

### D3. Estilo de la tarjeta votada

| Estado | Fondo y borde |
| --- | --- |
| A favor | `bg-green-50 border-green-200`, en oscuro `dark:bg-green-950/40 dark:border-green-900` |
| En contra | `bg-red-50 border-red-200`, en oscuro `dark:bg-red-950/40 dark:border-red-900` |
| No votado | `bg-surface border-line` (sin cambios) |

- El desglose reutiliza `ThumbIcon` con dos chips pequeños: «8» con pulgar arriba y «4» con pulgar abajo. Cada chip lleva `aria-label` («8 a favor», «4 en contra»).
- La etiqueta «Has votado a favor/en contra» va en un `<span className="sr-only">`, porque el color y el icono ya lo transmiten visualmente.
- Se mantienen las tonalidades de `VoteResults` para no introducir tokens nuevos.

### D4. Actualización de las listas al votar

`TopicView`, en `onSuccess` de `castVote`, invalida `["topics"]` y además `["user-topics"]`. TanStack Query vuelve a pedir la lista activa al volver atrás, así que la tarjeta aparece marcada sin recargar.

## Risks / Trade-offs

- [Más datos por tema en los listados] → Tres campos pequeños y sin consultas extra.
- [Diferencias de abreviatura de meses entre motores de JavaScript] → La prueba unitaria usa el mismo `Intl` del entorno y el E2E se ejecuta en Chromium (también dentro del WebView de Android).
- [Las pruebas que construyen `TopicSummary` a mano dejan de compilar] → Se actualizan en la tarea de pruebas del frontend.

## Migration Plan

No hay cambios de esquema. El contrato de la API es compatible hacia atrás (solo añade campos). Se despliegan juntos backend y frontend.
