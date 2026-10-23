## 1. Almacenamiento de imágenes (TKT-024)

- [x] 1.1 Definir la interfaz `ImageStorage` (`upload(file) → { url, key }`, `remove(key)`) en `src/server/storage`
- [x] 1.2 Implementar `S3ImageStorage` con `@aws-sdk/client-s3` (`forcePathStyle` para MinIO) y clave `topics/<uuid>.<ext>`
- [x] 1.3 Implementar la validación: tamaño ≤ 5 MB (`413`) y tipo JPEG/PNG/WebP por magic bytes con `file-type` (`415`)
- [x] 1.4 Implementar `InMemoryImageStorage` para tests y seleccionarla por variable de entorno en test

## 2. Creación de temas (TKT-025)

- [x] 2.1 Esquema Zod `createTopicSchema` (`title` 3–120 tras `trim`, `visibility` `PUBLIC|PRIVATE`) en `src/lib/validation/topic.ts`
- [x] 2.2 Implementar `TopicService.create(input, authorId)`: validar → subir imagen si existe → insertar; borrado de mejor esfuerzo de la imagen si falla la inserción
- [x] 2.3 Añadir el método `POST` a `src/app/api/topics/route.ts` leyendo `formData()`, con límite de body de 6 MB, respuesta `201 { id }`

## 3. Interfaz de creación (TKT-026)

- [x] 3.1 Añadir la opción "Crear tema" al `MainMenu`
- [x] 3.2 Crear `src/app/temas/nuevo/page.tsx` con campo de título, selector de imagen opcional (`accept="image/jpeg,image/png,image/webp"`) y selector Público/Privado (Público por defecto)
- [x] 3.3 Validación en cliente con el mismo esquema Zod, errores por campo (título, imagen) y botón deshabilitado durante el envío
- [x] 3.4 Tras `201`, invalidar la caché de tendencias y redirigir a `/temas/[id]`

## 4. Pruebas (TKT-027)

- [x] 4.1 Unitarios de validación de imagen: PNG válido, 6 MB (`413`), PDF renombrado a `.jpg` (`415`)
- [x] 4.2 Integración de `POST /api/topics`: público sin imagen, público con imagen, privado, título de 2 y 121 caracteres
- [x] 4.3 Integración: el tema privado creado no aparece en `GET /api/topics` ni en búsquedas; el creador obtiene `200` en `GET /api/topics/:id`
- [x] 4.4 E2E: crear un tema público con imagen desde el menú → se muestra con la imagen a media pantalla → otro usuario lo encuentra en la búsqueda
