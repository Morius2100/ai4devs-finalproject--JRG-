## 1. Amistades y acceso a temas privados (TKT-028)

- [x] 1.1 Implementar `FriendshipService.areFriends(userId, otherId)` y `getFriendIds(userId)` en `src/server/services/friendship-service.ts`
- [x] 1.2 Inyectar `FriendshipService.areFriends` en `VisibilityPolicy` (privado → creador o amigo del creador)
- [x] 1.3 Verificar que `TopicService.getById`, `VoteService.castVote` y `VoteService.listOpinions` usan la política ampliada (sin duplicar lógica)

## 2. Generación de notificaciones (TKT-029)

- [x] 2.1 Implementar `NotificationService.notifyFriendsOfPrivateTopic(topic, tx)` con un único `INSERT … SELECT` desde `friendships`
- [x] 2.2 Envolver `TopicService.create` en una transacción que, si `visibility = PRIVATE`, invoque `notifyFriendsOfPrivateTopic`
- [x] 2.3 Ampliar `prisma/seed.ts` con un tema privado de `ana` y sus notificaciones a `bruno` y `carla`

## 3. API de notificaciones (TKT-030)

- [x] 3.1 Implementar `NotificationService.listForUser(userId, cursor)` (keyset 20, `createdAt DESC, id DESC`, con `actor.username` y `topic.{id,title}`)
- [x] 3.2 Implementar `GET /api/notifications` en `src/app/api/notifications/route.ts`

## 4. Pantalla de notificaciones (TKT-031)

- [x] 4.1 Añadir la opción "Notificaciones" al `MainMenu`
- [x] 4.2 Crear `src/app/notificaciones/page.tsx` con lista scrolleable, texto "<usuario> ha creado una nueva propuesta: <título>", enlace a `/temas/[id]` y estado vacío

## 5. Pruebas (TKT-032)

- [x] 5.1 Integración de la política: creador, amigo y no amigo en detalle (`200`/`200`/`404`), voto (`201`/`201`/`404`) y opiniones
- [x] 5.2 Integración de notificaciones: privado con 2 amigos → 2 notificaciones; público → 0; sin amigos → 0; atomicidad (fallo simulado al notificar → no se crea el tema)
- [x] 5.3 Integración de `GET /api/notifications`: orden y solo las propias
- [x] 5.4 E2E: `ana` crea un tema privado → `bruno` ve la notificación, la pulsa, vota y ve resultados → `dani` recibe "tema no encontrado" en la misma URL
