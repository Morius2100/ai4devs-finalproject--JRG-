## Context

Los temas solo se crean (`TopicService.create`). El esquema ya define `onDelete: Cascade` desde `Topic` hacia `votes`, `notifications` y `topic_views`, así que borrar la fila del tema deja la base de datos coherente sin migración. La imagen, en cambio, vive en el almacenamiento S3 y la clave está en `topics.image_url`; `ImageStorage.remove(key)` ya existe (se usa para limpiar una subida fallida). El detalle (`TopicService.getById`) no dice si el visitante es el autor, aunque ya compara `authorId` con `viewerId` para marcar la visita.

## Goals / Non-Goals

**Goals:**
- Que el autor pueda retirar su tema desde su detalle, con confirmación y sin dejar rastro (votos, notificaciones, visitas, imagen).
- Que nadie más pueda borrarlo, aunque llame a la API directamente.
- Mantener el diseño de la aplicación y la accesibilidad.

**Non-Goals:**
- Editar temas, borrar temas ajenos, moderación, restauración o «papelera», borrar desde listas o perfil.
- Cambiar el esquema de datos.

## Decisions

1. **`DELETE /api/topics/:id` → `TopicService.delete(id, userId)`.** El Route Handler valida el id, llama a `requireUser()` y delega; sin reglas en la ruta (capas de `CLAUDE.md`). Responde `204`.
2. **Autoría comprobada en el servidor, con `404` uniforme.** El servicio lee `imageUrl` y borra con `deleteMany({ where: { id, authorId: userId } })`; si `count === 0` (no existe o no es suyo) lanza `NotFoundError`. La comprobación y el borrado son una sola sentencia, sin ventana entre ambas.
   - *Alternativa:* `403` para quien ve un tema público que no es suyo. Descartada: el proyecto responde `404` a lo inexistente y a lo inaccesible, y un `403` distinguiría casos sin aportar nada al cliente legítimo (que ni siquiera ve el botón).
   - `VisibilityPolicy` no interviene: «ser autor» es más estricto que «poder ver» y el autor siempre puede ver su tema.
3. **La imagen se borra después de confirmar la fila.** Orden: borrar el tema → `ImageStorage.remove(key)` de mejor esfuerzo (si falla, se registra y no se devuelve error: el objeto huérfano no es accesible porque `/api/media` comprueba la visibilidad del tema, que ya no existe). Al revés, un fallo del borrado en la base de datos dejaría un tema sin imagen.
4. **`isAuthor` en `TopicDetail`.** `getById` devuelve `isAuthor: topic.authorId === viewerId`. No expone el id del autor ni datos personales. La interfaz solo lo usa para mostrar u ocultar el botón; no es una medida de seguridad.
5. **Interfaz: `DeleteTopicButton` dentro de `TopicView`.**
   - **Botón:** a la derecha del título (`flex items-start justify-between`), de modo que queda en el mismo sitio con o sin imagen y no tapa la imagen. Círculo de 44 px (`h-11 w-11 rounded-full`), fondo `bg-surface-muted`, icono de papelera en SVG de trazo (`stroke="currentColor"`, `strokeWidth="2"`, mismo estilo que `ThumbIcon`) en `text-red-600`, `aria-label="Borrar tema"` y foco visible.
   - **Confirmación:** misma estructura que `JustificationDialog` (hoja inferior `fixed inset-0 z-20`, `role="alertdialog"`, foco atrapado, `Esc` cancela, foco inicial en «Cancelar»). Título «¿Borrar este tema?», texto «Se borrarán también sus votos y opiniones. No se puede deshacer.», botones «Cancelar» (`btn-secondary`) y «Borrar» (`bg-red-600`, el rojo del voto en contra), y «Borrando…» mientras se envía.
   - *Alternativa:* extraer un diálogo común con `JustificationDialog`. Descartada ahora: es un refactor ajeno al cambio; solo se repite la gestión de foco y `Esc`.
6. **Tras borrar:** `router.replace("/")`, se elimina la consulta `["topic", id]` (para que Atrás no muestre el tema borrado) y se invalidan `["topics"]`, `["user-topics"]`, `["stories"]` y las consultas de notificaciones. Si el servidor responde `404` (ya borrado, p. ej. desde otro dispositivo), se trata igual que un éxito: el objetivo (que no exista) está cumplido.
7. **App Android.** Usa la misma interfaz y `apiFetch` con `Authorization: Bearer`; `DELETE` ya está permitido en CORS (`src/middleware.ts`). No requiere cambios nativos.

## Risks / Trade-offs

- [Borrado accidental] → Confirmación con texto explícito, foco inicial en «Cancelar» y botón separado del resto de acciones.
- [Votar mientras se borra: `VoteService.castVote` comprueba el tema y luego inserta; si el tema desaparece entre ambos pasos, el `INSERT` falla por clave foránea] → Al implementar, comprobar qué responde; si es un `500`, traducir ese error a `NotFoundError` en `VoteService` (cambio mínimo; sigue siendo el único que escribe votos).
- [Imagen huérfana si falla el borrado en el almacenamiento] → Inaccesible a través de la API; queda un objeto sin referencias. Aceptado en este MVP; se registra el fallo.
- [El APK ya instalado no muestra el botón] → Hay que recompilarlo (`npm run build:mobile`); se documenta.
- [Se borran datos de otras personas (sus votos y opiniones) sin avisarles] → Decisión de producto aceptada: el autor es dueño del tema. No hay notificación de borrado (el producto no las incluye para esto).

## Migration Plan

1. Sin migración de base de datos.
2. Desplegar API y servicio; después la interfaz. Si la interfaz llegase antes, el botón fallaría con `404`/`405` y mostraría el mensaje de error.
3. Rollback: revertir el despliegue. Los temas ya borrados no se recuperan.

## Open Questions

- Ninguna bloqueante. Futuro: ¿avisar a quienes votaron? Fuera de este alcance.
