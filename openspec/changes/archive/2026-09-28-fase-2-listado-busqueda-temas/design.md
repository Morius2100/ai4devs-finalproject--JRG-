## Context

La tabla `topics` ya existe (fase 1) con contadores desnormalizados (`total_votes`) y los índices de tendencia y trigram. Todavía no existe creación de temas por UI (fase 5), por lo que los datos proceden del seed.

## Goals / Non-Goals

**Goals:**

- Tendencias = temas públicos por `totalVotes DESC, createdAt DESC, id DESC` (supuesto S-04).
- Búsqueda parcial por título sin distinguir mayúsculas/minúsculas (S-08), con el mismo orden.
- Scroll infinito eficiente para listas grandes.

**Non-Goals:**

- Mostrar temas privados en listados (S-06).
- Filtros, categorías u otros criterios de orden (no especificados).
- Contenido de la tarjeta más allá del título (el tema solo tiene título e imagen; la imagen se muestra al entrar en el tema).

## Decisions

- **Paginación keyset** (`WHERE (total_votes, created_at, id) < (…)`) en lugar de `OFFSET`: estable mientras llegan votos nuevos y con coste constante por página. Tamaño 20.
- **Un único endpoint** `GET /api/topics` con `q` opcional: la UI solo cambia el parámetro; `q` vacío tras `trim` equivale a tendencias.
- **Búsqueda con `ILIKE '%q%'`** escapando `%`, `_` y `\`, apoyada en el índice GIN trigram sobre `lower(title)`. Se descarta búsqueda full-text (`tsvector`) porque el título es corto y se busca por subcadena.
- **Primera página renderizada en servidor** (RSC) y páginas siguientes con `useInfiniteQuery` de TanStack Query + `IntersectionObserver` sobre un centinela al final de la lista.
- **Debounce de 300 ms** en `SearchBar` y sincronización con `?q=` en la URL para que el botón atrás conserve la búsqueda.

## Risks / Trade-offs

- [La definición de tendencia es un supuesto (Q-02)] → Encapsulada en `TopicService.listTrending`; cambiarla solo afecta a ese método y a su índice.
- [Keyset con orden por contador mutable puede duplicar/omitir un tema si cambia de votos entre páginas] → Aceptable para una lista de descubrimiento; el cliente descarta duplicados por `id`.
