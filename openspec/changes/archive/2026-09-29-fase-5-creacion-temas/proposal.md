## Why

Los usuarios deben poder crear, desde el menú principal, nuevos temas para que el resto los vote, eligiendo si son públicos o privados y adjuntando opcionalmente una imagen que se mostrará en la pantalla del tema (§6 de la definición del producto).

## What Changes

- Servicio de almacenamiento de imágenes S3-compatible con validación de tipo y tamaño (TKT-024).
- Creación de temas con título, imagen opcional y visibilidad; endpoint `POST /api/topics` (TKT-025).
- Opción "Crear tema" en el menú principal y pantalla `/temas/nuevo` (TKT-026).
- Pruebas (TKT-027).

## Capabilities

### New Capabilities

- `creacion-temas`: crear temas públicos o privados con imagen opcional desde el menú principal (HU-08, HU-09, HU-10).

### Modified Capabilities

<!-- Ninguna -->

## Impact

- Añade `ImageStorage` (`src/server/storage`), `TopicService.create`, el método `POST` en `src/app/api/topics/route.ts` y la página `/temas/nuevo`.
- Añade las dependencias `@aws-sdk/client-s3` y `file-type`.
- Los temas públicos creados aparecen en tendencias y búsqueda (fase 2); los privados quedan preparados para la fase 6 (acceso de amigos y notificaciones).
