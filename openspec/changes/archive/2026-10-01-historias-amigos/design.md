## Context

- **Amistad simétrica** en `friendships` (dos filas por pareja). Leer los amigos de X es `WHERE user_id = X`. Decisión del usuario: se mantiene simétrica.
- `VisibilityPolicy` es el único punto que decide el acceso a un tema (`docs/02-arquitectura.md` §2.6). Los amigos acceden a los temas públicos y privados del autor.
- `TopicService.getById(id, viewerId)` es el único camino para cargar la pantalla de un tema (`GET /api/topics/:id`, usado por `TopicScreen` y al recargar tras un `409`).
- `topics` tiene índice por `author_id`. `created_at` es `timestamptz`.
- `HomeScreen` = `SearchBar` + `TopicList`. La búsqueda activa viene de `?q=`.
- `Avatar` (`src/components/people/Avatar.tsx`) ya pinta foto o inicial con color estable.
- **Seed**: los temas se crean una sola vez (se saltan si existen) con fechas relativas al primer seed. Pasadas 24 horas no quedarían historias de ejemplo.
- La interfaz también se exporta a la app Android: todo se hace con consultas de cliente y rutas estáticas.

## Goals / Non-Goals

**Goals:**
- Burbujas con los temas nuevos de amigos no vistos, en una sola consulta.
- Registrar las visitas sin peticiones extra desde el cliente.
- Que las burbujas se actualicen al volver de un tema sin recargar.

**Non-Goals:**
- Un visor de historias a pantalla completa con barras de progreso y avance automático. La burbuja abre la pantalla de tema existente.
- Historias de personas que no son amigas, o de temas de más de 24 horas.
- Notificaciones nuevas, o marcar como visto sin abrir el tema.
- Purgar `topic_views` antiguos (volumen pequeño; se valorará si crece).

## Decisions

### D1. Tabla `topic_views`

```prisma
model TopicView {
  userId   String   @map("user_id") @db.Uuid
  topicId  String   @map("topic_id") @db.Uuid
  viewedAt DateTime @default(now()) @map("viewed_at") @db.Timestamptz
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  topic    Topic    @relation(fields: [topicId], references: [id], onDelete: Cascade)

  @@id([userId, topicId])
  @@map("topic_views")
}
```

La clave primaria `(user_id, topic_id)` impide duplicados y sirve de índice para el `NOT EXISTS` de las historias. Se guarda la primera visita.

- *Alternativa:* un array de temas vistos en `users`. Descartada porque no tiene integridad referencial y crece sin límite.

### D2. Registro de la visita dentro de `getById`

Tras comprobar el acceso con `VisibilityPolicy`, y solo si `topic.authorId !== viewerId`:

```sql
INSERT INTO topic_views (user_id, topic_id) VALUES (…) ON CONFLICT DO NOTHING
```

- Así cualquier forma de abrir un tema cuenta y el cliente no necesita una petición adicional.
- Si el tema no existe o no es accesible, se lanza `NotFoundError` antes de registrar nada.
- Un `GET` con este efecto es idempotente y equivalente a un contador de visitas: no altera el recurso que se devuelve.
- *Alternativa:* `POST /api/topics/:id/views` desde `TopicScreen`. Descartada porque añade una petición por apertura y, si falla, la burbuja no desaparece aunque el tema se haya visto.

### D3. `StoryService.listForUser(viewerId)` y `GET /api/stories`

Una sola consulta:

```sql
SELECT u.id, u.username, u.avatar_url,
       array_agg(t.id ORDER BY t.created_at, t.id) AS topic_ids,
       max(t.created_at) AS latest_created_at
FROM friendships f
JOIN users  u ON u.id = f.friend_id
JOIN topics t ON t.author_id = f.friend_id
             AND t.created_at > now() - interval '24 hours'
WHERE f.user_id = ${viewerId}::uuid
  AND NOT EXISTS (SELECT 1 FROM topic_views tv
                  WHERE tv.user_id = ${viewerId}::uuid AND tv.topic_id = t.id)
GROUP BY u.id, u.username, u.avatar_url
ORDER BY latest_created_at DESC, u.id
LIMIT 50
```

- Para no duplicar la regla de acceso, el servicio filtra cada tema con `VisibilityPolicy.canAccess(topic, viewerId, { areFriends: true })` antes de responder. El `JOIN` con `friendships` ya garantiza la amistad, así que el filtro es en memoria y sin consultas extra.
- Respuesta: `200 { items: [{ author: { id, username, avatarUrl }, topicIds: string[], latestCreatedAt: string }] }`, sin paginación.
- El límite de 50 amigos cubre la fila horizontal; los que no quepan esperan a que se vean los primeros.
- La ventana de 24 horas se calcula en la base de datos (`now()`), no en el cliente.

### D4. `StoriesBar` en `HomeScreen`

- Se pinta solo si `q` está vacío. Usa `useQuery(["stories"], fetchStories)` y, sin elementos, devuelve `null`.
- Cada burbuja es un `Link` a `/tema?id=${topicIds[0]}` con `Avatar` de 64 px dentro de un anillo `conic-gradient` amarillo → verde de marca, el nombre truncado debajo y un contador si `topicIds.length > 1`.
- La fila es un `<nav aria-label="Historias de tus amigos">` con `overflow-x-auto` y `snap-x`.
- `TopicScreen`, cuando la consulta del tema termina con éxito, invalida `["stories"]`. Al volver atrás, TanStack Query pide las historias de nuevo y la burbuja refleja el cambio.
- Mientras carga no se reserva hueco, para que la lista no salte si no hay historias.

### D5. Seed con historias renovables

`prisma/seed.ts` añade tres temas de historia: dos de «carla» (hace 5 h y 2 h) y uno de «bruno» (hace 1 h), públicos. Los busca por título y, si existen, les actualiza `createdAt` al momento relativo actual. También borra las visitas de «ana» a esos temas. Así las historias de «ana» se pueden probar siempre tras `npm run prisma:seed`.

## Risks / Trade-offs

- [Un `GET` con efecto] → Idempotente y documentado. Ningún componente precarga `GET /api/topics/:id` sin que el usuario abra el tema.
- [Coste de la consulta con muchos amigos] → Usa `friendships(user_id)`, `topics(author_id)` y la clave primaria de `topic_views`, limitado a 24 horas y 50 filas.
- [Diferencia de reloj entre servidor y cliente] → La ventana la decide la base de datos.
- [El seed deja de ser estrictamente idéntico entre ejecuciones (fechas relativas)] → Se documenta en `docs/03-modelo-datos.md` §3.6; el resto del seed sigue siendo idempotente.

## Migration Plan

1. Migración `add_topic_views`: solo crea una tabla, sin tocar datos existentes.
2. Desplegar backend y frontend juntos. Sin la tabla, `getById` fallaría, así que la migración va primero.
3. Vuelta atrás: revertir el código. La tabla puede quedarse sin efecto o eliminarse con una migración.
