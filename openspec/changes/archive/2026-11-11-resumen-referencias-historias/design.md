## Context

Tickets citados en el §5 y su título en `docs/05-tickets.md`:

| HU | Tickets | Spec |
| --- | --- | --- |
| HU-01 Ver las tendencias | TKT-011 (BE) Servicio de tendencias y búsqueda · TKT-012 (BE) `GET /api/topics` · TKT-013 (FE) Pantalla principal con lista scrolleable · TKT-015 (QA) Pruebas de descubrimiento | `descubrimiento-temas` |
| HU-04/05 Votar y justificar | TKT-019 (BE) Emisión de voto · TKT-021 (FE) Flujo de voto con justificación · TKT-023 (QA) Pruebas de votación | `votacion` |
| HU-12 Notificar amigos | TKT-029 (BE) Generación de notificaciones · TKT-030 (BE) `GET /api/notifications` · TKT-031 (FE) Pantalla de notificaciones · TKT-032 (QA) Pruebas de temas privados y notificaciones | `notificaciones` |

## Goals / Non-Goals

**Goals:**
- Que la historia se entienda sin abrir los tickets ni la spec.
- Un máximo de una línea por historia, como pide la revisión.

**Non-Goals:**
- Copiar el detalle de los tickets (tareas, criterios, definición de hecho) en el §5. El §6 ya incluye tres tickets completos.

## Decisions

1. **Formato de la línea:**
   `> **En resumen:** <qué hace el backend> (TKT-…), <qué hace el frontend> (TKT-…) y <qué prueba QA> (TKT-…). La spec <id> fija <reglas clave>.`
   Por ejemplo, en HU-01:
   «El backend calcula las tendencias y la búsqueda y las expone en `GET /api/topics` con paginación por cursor (TKT-011, TKT-012). El frontend pinta la lista con scroll continuo (TKT-013) y QA cubre orden, paginación y exclusión de privados (TKT-015). La spec `descubrimiento-temas` fija el orden y el tamaño de página.»
   *Alternativa:* una tabla por historia. Descartada porque ocupa más de una línea, que es lo que pide la revisión.
2. **El contenido se extrae de `docs/05-tickets.md` y `openspec/specs/<id>/spec.md`**, no se inventa. Si el código ya no coincide con un ticket, manda lo documentado.

## Risks / Trade-offs

- [Desajuste entre el resumen y el ticket si este cambia] → El resumen solo describe propósito y capa, no detalles que cambien a menudo.
