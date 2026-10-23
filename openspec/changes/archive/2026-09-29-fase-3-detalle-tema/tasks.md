## 1. Visibilidad y detalle (TKT-016)

- [x] 1.1 Implementar `VisibilityPolicy.canAccess(topic, viewerId, { areFriends })` en `src/server/services/visibility-policy.ts` (público → sí; privado → creador; `areFriends` inyectado devolviendo `false` en esta fase)
- [x] 1.2 Implementar `TopicService.getById(id, viewerId)` que lanza `NotFoundError` si no existe o no hay acceso y devuelve `TopicDetail` con `myVote` y `results` solo si `myVote` no es nulo
- [x] 1.3 Implementar `GET /api/topics/:id` en `src/app/api/topics/[id]/route.ts`

## 2. Pantalla de tema (TKT-017)

- [x] 2.1 Configurar `images.remotePatterns` de Next.js con el dominio de `S3_PUBLIC_URL`
- [x] 2.2 Crear `TopicImage` (`h-[50dvh] w-full object-cover`, `priority`), renderizado solo si hay `imageUrl`
- [x] 2.3 Crear `VoteButtons` fijos en la parte inferior: 👍 verde y 👎 rojo con `aria-label`, con callback `onSelect(value)` (sin acción de red en esta fase)
- [x] 2.4 Crear `src/app/temas/[id]/page.tsx` (`TopicPage`): imagen opcional, título y `VoteButtons` o un contenedor `VoteResults` provisional si `myVote` existe
- [x] 2.5 Crear `src/app/temas/[id]/not-found.tsx` con enlace a la pantalla principal

## 3. Pruebas (TKT-018)

- [x] 3.1 Unitarios de `VisibilityPolicy` (público, privado propio, privado ajeno)
- [x] 3.2 Integración de `GET /api/topics/:id`: tema público, inexistente (404), privado ajeno (404), sin totales si no ha votado, con totales si ha votado (voto insertado por seed)
- [x] 3.3 Tests de componente de `TopicPage`: con imagen, sin imagen, no votado (botones), votado (resultados)
- [x] 3.4 E2E en viewport 390×844: desde la lista se entra en un tema con imagen, la imagen mide la mitad de la altura y los botones están abajo
