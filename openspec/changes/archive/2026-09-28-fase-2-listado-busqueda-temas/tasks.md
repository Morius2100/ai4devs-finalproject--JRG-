## 1. Servicio de dominio (TKT-011)

- [x] 1.1 Crear `TopicService.listTrending({ cursor })`: solo `PUBLIC`, orden `totalVotes DESC, createdAt DESC, id DESC`, keyset de 20, devuelve `{ items: TopicSummary[], nextCursor }`
- [x] 1.2 Crear `TopicService.search({ q, cursor })`: `ILIKE` sobre el título con escape de `%`, `_` y `\`, mismo orden y paginación
- [x] 1.3 Ampliar `prisma/seed.ts` con 25 temas públicos con votos variados (algunos con imagen)

## 2. API (TKT-012)

- [x] 2.1 Esquema Zod `listTopicsQuerySchema` (`q` opcional 1–100 caracteres tras `trim`, `cursor` opcional)
- [x] 2.2 Implementar `GET /api/topics` en `src/app/api/topics/route.ts` (sin `q` → tendencias; con `q` → búsqueda)

## 3. Pantalla principal (TKT-013)

- [x] 3.1 Configurar el `QueryClientProvider` de TanStack Query en el layout raíz
- [x] 3.2 Crear `TopicListItem` (título, enlace a `/temas/[id]`, área táctil ≥ 44 px)
- [x] 3.3 Crear `TopicList` con `useInfiniteQuery`, centinela con `IntersectionObserver`, deduplicación por `id`, estados de carga, vacío y error
- [x] 3.4 Reemplazar la página `/` provisional por `HomePage` con primera página renderizada en servidor

## 4. Buscador (TKT-014)

- [x] 4.1 Crear `SearchBar` fijo en la parte superior con debounce de 300 ms y sincronización con `?q=`
- [x] 4.2 Conectar `SearchBar` con `TopicList`: texto vacío → tendencias; texto → búsqueda; mensaje "sin resultados"

## 5. Pruebas (TKT-015)

- [x] 5.1 Integración de `TopicService`: orden por tendencia, desempate por fecha, paginación sin repetidos, exclusión de privados, búsqueda insensible a mayúsculas y escape de `%`
- [x] 5.2 Test de componente de `TopicList` (estado vacío, fin de lista) y `SearchBar` (debounce, vaciar)
- [x] 5.3 E2E: scroll carga más temas, búsqueda filtra, vaciar búsqueda vuelve a tendencias, pulsar un tema navega a su pantalla
