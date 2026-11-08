## Why

La Revisión 1 de LIDR (tarea **T6**) pide decidir qué hacer con las amistades, de las que dependen los temas privados. Se mantiene el sistema de amistades. Al revisar el código para documentarlo se ha comprobado que, tal como está, **no protege la confidencialidad**: cualquier usuario puede hacerse amigo de cualquier otro con una petición (`PUT /api/users/:id/friendship`, sin solicitud ni aceptación) y desde ese momento lee todos sus temas privados, recibe sus historias y sus notificaciones. Además hay otras carencias de seguridad que conviene cerrar. El detalle está en [docs/09-revision-seguridad.md](../../../docs/09-revision-seguridad.md).

## What Changes

- **Amistad con consentimiento** (hallazgo S-01, crítico): añadir solicitud y aceptación. Solo la amistad aceptada concede acceso a temas privados, historias y notificaciones. Cambia lo decidido en Q-01 y cierra Q-04.
- **Limitación de intentos** en inicio de sesión, token de la app, registro y solicitudes de amistad (S-03).
- **Credenciales de prueba fuera de producción**: el build de Vercel no debe poder cargar el seed (`password123`) en producción sin una confirmación explícita (S-02).
- **Cuentas**: respuesta y tiempo uniformes en el login, y longitud máxima de contraseña (S-04, S-09).
- **Imágenes de temas privados** accesibles solo a quien puede ver el tema (S-05).
- **Cabeceras de seguridad HTTP** (S-06) y revisión de la sesión de 30 días sin revocación (S-07).
- Actualizar `docs/01-producto.md` (S-02, Q-04), `docs/02-arquitectura.md` y `docs/03-modelo-datos.md`, y mantener el README de entrega.

Este change **solo documenta**; no se ha tocado código.

## Capabilities

### New Capabilities
- `confidencialidad-usuarios`: protecciones transversales de seguridad y privacidad (límite de intentos, cuentas, imágenes privadas, cabeceras, credenciales de seed).

### Modified Capabilities
- `amistades`: la amistad pasa a requerir solicitud y aceptación; se modifica «Añadir a amigos» y se añaden las solicitudes, su aceptación o rechazo y su cancelación.

## Impact

- **Código (cuando se aplique):** `src/server/services/friendship-service.ts`, `src/app/api/users/[id]/friendship/route.ts`, `src/components/people/FriendToggle.tsx`, `src/middleware.ts`, `src/app/api/media/[...key]/route.ts`, `src/lib/validation/auth.ts`, `scripts/vercel-build.mjs`, `next.config.ts` y `prisma/schema.prisma` (nueva tabla de solicitudes con su migración).
- **Sin cambios:** `VisibilityPolicy`, `StoryService` y `NotificationService` siguen leyendo `friendships`, que a partir de ahora solo contiene amistades aceptadas.
- **Producto:** `docs/01-producto.md` lista «solicitudes de amistad con aceptación» como fuera del producto. Aplicar este change exige quitarla de esa lista; es una decisión de producto (Q-04), no solo técnica.
- **Contrato de API:** nuevos endpoints de solicitudes y cambio de `PUT /api/users/:id/friendship`.
