## Why

La Revisión 1 de LIDR (tarea **T9**) pide priorizar la implementación y las pruebas, y generar los casos de test **a partir de los criterios de las historias**. Los tests existentes cubrían la mayoría de los criterios, pero sin citarlos, así que no se podía comprobar qué criterio tenía test, y faltaban varios casos de pantalla (acceso, búsqueda sin resultados, opiniones, notificaciones, flujo de voto y formulario de creación) y de API (imágenes no válidas al crear un tema, paginación de la búsqueda).

## What Changes

- Tests nuevos que citan el criterio en el título (`CA-07.3 · …`) para HU-00 a HU-12: 67 tests en 5 ficheros.
- Documento de trazabilidad `docs/10-trazabilidad-criterios.md` con cada criterio y los tests que lo cubren, y la lista de los que no se pueden automatizar.
- `tests/setup.ts` desactiva el límite de intentos por defecto en las pruebas: el contador de registro se acumulaba entre ejecuciones y hacía fallar `auth.test.ts`.

## Capabilities

### New Capabilities
- `trazabilidad-pruebas`: cada criterio de aceptación de las historias tiene al menos un test automático identificable, o consta como no automatizable con su motivo.

### Modified Capabilities
<!-- Ninguna. -->

## Impact

- **Afectado:** solo `tests/` y `docs/`. No cambia código de la aplicación.
- **Pendiente (siguientes pasos de T9):** pruebas de accesibilidad (axe) y dejar trazado el uso de IA en la implementación.
