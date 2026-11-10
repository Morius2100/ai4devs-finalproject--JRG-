## Why

Hoy un tema publicado no se puede retirar: `docs/01-producto.md` lista «edición o borrado de temas» como fuera del producto. Quien publica un tema por error, o con algo que ya no quiere mostrar, no tiene forma de quitarlo, y el tema sigue visible en tendencias, búsqueda, perfil y notificaciones. El producto pasa a incluir el borrado, limitado al **autor** y desde la **pantalla de detalle de su propio tema**. Es una decisión de producto, no solo técnica: obliga a quitar el borrado de la lista de exclusiones.

## What Changes

- **Borrado de un tema propio** (nueva historia **HU-23**): un botón con una papelera en la pantalla de detalle del tema, visible solo para su autor. Pide confirmación antes de borrar y, al confirmar, vuelve a la pantalla de temas.
- **Solo el autor**: el servidor lo comprueba siempre (la interfaz solo oculta el botón). Quien no es el autor recibe `404`, igual que ante un tema inexistente o inaccesible, para no revelar nada.
- **API**: nuevo `DELETE /api/topics/:id`; `GET /api/topics/:id` añade `isAuthor` al detalle para decidir si se muestra el botón.
- **Datos**: se borran el tema y, en cascada (ya definida en el esquema), sus votos, notificaciones y visitas; la imagen se elimina del almacenamiento. No cambia el esquema ni hay migración.
- **Caché del cliente**: tras borrar se invalidan tendencias, búsqueda, temas de un usuario, historias y notificaciones.
- **Diseño**: el botón sigue el estilo de la aplicación (icono de trazo como `ThumbIcon`, `rounded-full`, área táctil de 44 px, colores de las variables de tema) y la confirmación reutiliza el patrón del diálogo de justificación.
- **Documentación**: quitar el borrado de las exclusiones de `docs/01-producto.md` (**editar** un tema sigue fuera), añadir HU-23 a `docs/04-historias-usuario.md`, el endpoint a `docs/02-arquitectura.md` y la regla a `CLAUDE.md`.

No se incluye: editar un tema, borrar temas ajenos, moderación, papelera con restauración ni borrado desde listas o perfil.

## Capabilities

### New Capabilities
- `borrado-temas`: el autor borra su propio tema desde su detalle; permisos, confirmación, efectos sobre votos, notificaciones e imagen, y refresco de las pantallas.

### Modified Capabilities
- `detalle-tema`: el detalle de la API informa de si el visitante es el autor, y la pantalla muestra la papelera solo en ese caso.

## Impact

- **Código (cuando se aplique):** `src/server/services/topic-service.ts` (`delete`, `isAuthor` en `TopicDetail`), `src/app/api/topics/[id]/route.ts` (`DELETE`), `src/lib/api/topics.ts` (`deleteTopic`), `src/components/topics/TopicView.tsx` y un componente nuevo con el botón y la confirmación (`DeleteTopicButton`). Se usa el `ImageStorage.remove` existente.
- **Sin cambios:** `VisibilityPolicy` (el borrado exige ser autor, más estricto que poder ver el tema), `VoteService` (los votos desaparecen por la cascada de la base de datos; sigue siendo el único que los escribe), el esquema de Prisma y `src/middleware.ts` (ya admite `DELETE` en CORS).
- **Producto:** `docs/01-producto.md`, apartado de exclusiones.
- **Contrato de API:** nuevo `DELETE /api/topics/:id` y campo `isAuthor` en `GET /api/topics/:id`.
- **App Android:** misma interfaz y API; un APK ya compilado no muestra el botón hasta recompilarlo.
