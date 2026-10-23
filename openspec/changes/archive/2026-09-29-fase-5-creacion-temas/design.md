## Context

MinIO y el bucket `opina-images` existen desde la fase 1. La pantalla de tema ya muestra `imageUrl` (fase 3). Hasta ahora los temas solo provienen del seed.

## Goals / Non-Goals

**Goals:**

- Crear un tema con título (3–120), visibilidad (`PUBLIC`/`PRIVATE`) e imagen opcional.
- Imágenes seguras: solo JPEG/PNG/WebP reales y ≤ 5 MB.
- Mismo código de almacenamiento en local (MinIO) y producción (S3).

**Non-Goals:**

- Editar o borrar temas, recortar o editar imágenes, añadir descripción u otros campos (no especificados).
- Notificaciones a amigos y acceso de amigos a temas privados (fase 6).

## Decisions

- **`multipart/form-data` en un único `POST /api/topics`** (campos `title`, `visibility`, `image?`), leído con `request.formData()`. Se descarta la subida directa del navegador a S3 con URL prefirmada: añade un segundo paso y estados intermedios sin necesidad a este volumen.
- **Validación por _magic bytes_** con `file-type` además de la extensión/MIME declarados; tamaño comprobado antes de leer el contenido completo (`413` si > 5 MB, `415` si el tipo no está permitido).
- **Clave del objeto** `topics/<uuid>.<ext>` y `imageUrl = S3_PUBLIC_URL + "/" + clave`.
- **Orden de operaciones**: validar campos → subir imagen → insertar tema. Si la inserción falla tras la subida, se intenta borrar el objeto (mejor esfuerzo) y se registra en el log.
- **`ImageStorage` como interfaz** con implementación S3 y _fake_ en memoria para tests de integración y e2e sin red.
- **Tras crear, redirección a `/temas/[id]`**; el creador siempre accede a su propio tema (la `VisibilityPolicy` de la fase 3 ya lo contempla).
- **Selector de visibilidad** como dos opciones exclusivas "Público" / "Privado" con "Público" preseleccionado.

## Risks / Trade-offs

- [Objetos huérfanos si la BD falla tras subir] → Borrado de mejor esfuerzo; impacto limitado a almacenamiento.
- [Límite de tamaño de body en Route Handlers] → Configurar el límite a 6 MB y validar el tamaño del archivo explícitamente.
