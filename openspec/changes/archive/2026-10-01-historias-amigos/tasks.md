## 1. Documentación

- [x] 1.1 Actualizar `docs/01-producto.md` con la característica «Historias de amigos» y su funcionalidad: burbujas de temas nuevos de amigos en las últimas 24 h no vistos, pulsar para abrir y visitas registradas (TKT-054).
- [x] 1.2 Añadir a `docs/04-historias-usuario.md` la épica E10 · Historias con HU-19 (CA-19.1–CA-19.5) y actualizar el resumen (TKT-054).
- [x] 1.3 Añadir los tickets TKT-054 a TKT-058 al resumen y al detalle de `docs/05-tickets.md` (TKT-054).
- [x] 1.4 Actualizar `docs/02-arquitectura.md` (TKT-054):
  - `StoriesBar` en `HomePage`;
  - `StoryService`;
  - `GET /api/stories`;
  - registro de visitas en `GET /api/topics/:id`.
- [x] 1.5 Actualizar `docs/03-modelo-datos.md` con la tabla `topic_views` y las historias renovables del seed (TKT-054).
- [x] 1.6 Pruebas: `openspec validate historias-amigos --strict` sin errores (TKT-054).

## 2. Modelo de datos y seed

- [x] 2.1 Añadir el modelo `TopicView` (D1) a `prisma/schema.prisma`, con sus relaciones en `User` y `Topic`, y crear la migración `add_topic_views` (TKT-055).
- [x] 2.2 En `prisma/seed.ts`, crear o renovar tres temas públicos de historia (TKT-055):
  - de «carla», hace 5 h y hace 2 h;
  - de «bruno», hace 1 h;
  - borrar las visitas de «ana» a esos temas.
- [x] 2.3 Pruebas (TKT-055):
  - `npm run db:reset` aplica la migración y el seed;
  - una prueba de integración comprueba que la clave primaria impide duplicados y que borrar un tema borra sus visitas.

## 3. Backend: visitas e historias

- [x] 3.1 En `TopicService.getById`, tras comprobar el acceso y solo si el autor no es quien mira, registrar la visita con `INSERT … ON CONFLICT DO NOTHING` (TKT-056).
- [x] 3.2 Crear `src/server/services/story-service.ts` con `StoryService.listForUser(viewerId)` (TKT-056):
  - la consulta de D3;
  - el filtro con `VisibilityPolicy.canAccess`;
  - `topicIds` de más antiguo a más nuevo.
- [x] 3.3 Crear `src/app/api/stories/route.ts` con `GET` → `200 { items }` (TKT-056).
- [x] 3.4 Pruebas de integración en `tests/integration/stories.test.ts` para los escenarios de «Temas pendientes de ver» y «Registro de temas visitados» (TKT-056):
  - temas de amigos de las últimas 24 h, públicos y privados;
  - excluye temas de más de 24 h, de no amigos, propios y ya vistos;
  - orden por el más reciente y `topicIds` de más antiguo a más nuevo;
  - dejar de ser amigos lo quita;
  - abrir un tema lo registra una sola vez;
  - un tema sin acceso no registra la visita;
  - `401` sin sesión.

## 4. Frontend: burbujas

- [x] 4.1 Añadir `fetchStories()` en `src/lib/api/stories.ts` usando `apiFetch` (TKT-057).
- [x] 4.2 Crear `src/components/topics/StoriesBar.tsx` según D4 (TKT-057):
  - `nav` accesible;
  - burbujas con `Avatar`, anillo de marca, nombre y contador;
  - enlace al primer tema pendiente;
  - nada si no hay historias.
- [x] 4.3 En `HomeScreen`, pintar `StoriesBar` entre `SearchBar` y `TopicList` solo sin búsqueda activa (TKT-057).
- [x] 4.4 En `TopicScreen`, invalidar `["stories"]` cuando el tema se carga con éxito (TKT-057).
- [x] 4.5 Pruebas unitarias en `tests/unit/components/StoriesBar.test.tsx` (TKT-057):
  - burbuja con foto e inicial;
  - contador con varios temas;
  - orden;
  - nombre accesible;
  - enlace al primer tema;
  - sin historias no pinta nada;
  - oculta con búsqueda activa.

## 5. Verificación

- [x] 5.1 Pruebas E2E en `tests/e2e/historias.spec.ts` (TKT-058):
  - «bruno» crea un tema;
  - «ana» ve su burbuja, la pulsa y ve el tema;
  - al volver, la burbuja ya no está;
  - un tema de «dani» (no amigo) no genera burbuja.
- [x] 5.2 Pruebas: `npm run lint`, `npm run typecheck`, `npm test` y `npm run test:e2e` sin fallos (TKT-058).
- [ ] 5.3 Pruebas: generar e instalar la app de desarrollo y comprobar en el móvil las burbujas, su apertura y su desaparición al volver (TKT-058).
