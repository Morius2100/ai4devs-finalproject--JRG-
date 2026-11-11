> Origen: **Revisión 1 de LIDR, tarea T9**. No hay ticket TKT: es trabajo de pruebas sobre las historias HU-00 a HU-12.

## 1. Análisis de cobertura

- [x] 1.1 Extraer los criterios de `docs/04-historias-usuario.md` y contrastarlos con los títulos de los tests existentes (T9)
- [x] 1.2 Listar los huecos: acceso y registro, búsqueda sin resultados y paginada, opiniones, notificaciones, flujo de voto, formulario de creación e imágenes no válidas (T9)

## 2. Tests nuevos

- [x] 2.1 `criterios-autenticacion.test.tsx`: CA-00.1 a CA-00.4 (T9)
- [x] 2.2 `criterios-busqueda-opiniones-notificaciones.test.tsx`: CA-01.5, CA-02.x, CA-07.x, CA-12.x (T9)
- [x] 2.3 `criterios-votacion.test.tsx`: CA-03.x a CA-06.x (T9)
- [x] 2.4 `criterios-creacion-temas.test.tsx`: CA-08.x a CA-10.x (T9)
- [x] 2.5 `criterios-temas.test.ts` (integración): imágenes no válidas, límites del título y paginación de la búsqueda (T9)
- [x] 2.6 `tests/setup.ts`: límite de intentos desactivado por defecto en las pruebas (T9)

## 3. Trazabilidad y verificación

- [x] 3.1 `docs/10-trazabilidad-criterios.md` con cada criterio, sus tests y los no automatizables (T9)
- [x] 3.2 Ejecutar lint, typecheck y `npm test` dos veces seguidas sin fallos: 564 pruebas en verde (T9)
- [x] 3.3 Pruebas de accesibilidad (axe) sobre las pantallas principales: 16 situaciones sin infracciones y dos correcciones en la interfaz (T9)
- [x] 3.4 Dejar trazado el uso de IA en la implementación y las pruebas: `docs/11-uso-de-ia.md` y `prompts.md` §8 (T9)
