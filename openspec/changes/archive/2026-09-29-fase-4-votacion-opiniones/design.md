## Context

La pantalla de tema (fase 3) ya decide entre `VoteButtons` y un contenedor de resultados según `myVote`. La tabla `votes` tiene `UNIQUE (topic_id, user_id)` y `topics` contadores desnormalizados con un CHECK de coherencia.

## Goals / Non-Goals

**Goals:**

- Voto único garantizado por la base de datos incluso con peticiones concurrentes.
- Totales siempre coherentes con los votos.
- Transición de botones a resultados sin recargar la página.

**Non-Goals:**

- Cambiar o retirar un voto, responder o valorar opiniones, editar la justificación (no especificados).

## Decisions

- **Transacción única** (`prisma.$transaction`): comprobar acceso con `VisibilityPolicy` → `INSERT vote` → `UPDATE topics SET positive_votes = positive_votes + 1 (o negative), total_votes = total_votes + 1`. El `UNIQUE` hace fallar la segunda inserción concurrente (`P2002`) → `ConflictError` → `409`.
- **Normalización de la justificación** en servidor: `trim`; cadena vacía → `NULL`; máximo 500 caracteres (tras `trim`).
- **Opinión = voto con justificación no nula** (S-05). Los totales cuentan todos los votos.
- **La respuesta de `POST /votes` incluye los totales actualizados**, de modo que la UI pinta `VoteResults` inmediatamente y en paralelo pide la primera página de opiniones.
- **Opiniones solo para quien ha votado** (`403` si no), coherente con que los resultados se muestran tras votar.
- **Orden de opiniones**: más recientes primero, keyset `(created_at, id)`, página de 20.
- **Diálogo accesible**: `role="dialog"`, foco atrapado, `Esc`/"Cancelar" cierran sin votar; el color del botón "Votar" coincide con el voto elegido.
- **Colores de opinión**: fondo `bg-green-50` + borde `border-green-600` + icono 👍 para `UP`; `bg-red-50` + `border-red-600` + 👎 para `DOWN`. El icono evita depender solo del color.
- **Actualización de caché**: tras votar se invalida la consulta del tema y las listas de tendencias en TanStack Query.

## Risks / Trade-offs

- [Contadores desnormalizados pueden divergir si se inserta un voto fuera del servicio] → Único punto de escritura (`VoteService`) + CHECK en BD; script de recálculo opcional en el seed.
- [Doble pulsación en "Votar"] → Botón deshabilitado mientras la petición está en curso; el `409` se trata como "ya votaste" y se muestran los resultados.
