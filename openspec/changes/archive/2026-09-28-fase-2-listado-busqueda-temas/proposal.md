## Why

La pantalla principal es la puerta de entrada de Opina: al entrar, el usuario debe ver una lista scrolleable de temas sobre los que opinar, con las mayores tendencias mientras no busque nada, y un buscador en la parte superior (§5.1 de la definición del producto).

## What Changes

- Servicio de dominio para listar tendencias y buscar temas por título, con paginación por cursor (TKT-011).
- Endpoint `GET /api/topics` (con o sin `q`) (TKT-012).
- Pantalla principal con lista scrolleable de carga continua (TKT-013).
- Buscador en la parte superior de la pantalla principal (TKT-014).
- Pruebas de descubrimiento (TKT-015).

## Capabilities

### New Capabilities

- `descubrimiento-temas`: lista de tendencias, búsqueda por título y navegación a un tema desde la pantalla principal (HU-01, HU-02).

### Modified Capabilities

<!-- Ninguna -->

## Impact

- Sustituye la página `/` provisional de la fase 1.
- Añade `TopicService` (`src/server/services/topic-service.ts`), `src/app/api/topics/route.ts` y los componentes `SearchBar`, `TopicList`, `TopicListItem`.
- Añade la dependencia TanStack Query.
- Amplía el seed con 25 temas públicos con votos variados para probar ordenación y scroll.
