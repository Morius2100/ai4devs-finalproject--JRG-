## Context

`docs/04-historias-usuario.md` define unos 100 criterios (`CA-xx.y`). Había unos 500 tests, pero solo uno citaba un criterio. Para saber qué faltaba se contrastaron los títulos de los tests con cada criterio.

## Goals / Non-Goals

**Goals:**
- Cubrir los huecos reales de HU-00 a HU-12 con tests cuyo título cita el criterio.
- Dejar un mapa criterio → tests que se pueda mantener.

**Non-Goals:**
- Reescribir los tests existentes para añadirles el identificador.
- Pruebas de accesibilidad y de rendimiento (siguiente paso).
- Cubrir la APK de forma automática.

## Decisions

1. **Tests nuevos en ficheros `criterios-*`, agrupados por área**, en vez de editar los existentes: no se toca lo que ya funciona y el identificador del criterio queda en el título, así que `grep -rn "CA-07.3" tests` encuentra el test.
2. **Componentes con mocks de la capa `@/lib/api/*`** (rápidos, sin base de datos) para lo que es comportamiento de pantalla, e **integración con PostgreSQL** para lo que depende de reglas de servidor (imágenes rechazadas al crear un tema, paginación de la búsqueda).
3. **Trazabilidad a mano en un documento**, no generada: refleja también los criterios que cubre un e2e o un test antiguo sin identificador. Se acepta el coste de mantenerla.
4. **Límite de intentos desactivado en el setup de Vitest** (`RATE_LIMIT_DISABLED=1`); `rate-limit.test.ts` lo reactiva. Evita que el contador de una hora de `register:unknown` se acumule entre ejecuciones.

## Risks / Trade-offs

- [La tabla de trazabilidad se desactualiza] → El documento indica cómo buscar por identificador; se revisa al archivar cada change.
- [Algunos tests de componente son débiles, por ejemplo el de título inválido comprueba que aparece un aviso, no su texto exacto] → La regla de longitud queda cubierta con precisión en la integración (`criterios-temas`, `create-topic`).
- [El e2e de CA-03.2 depende del estado de la BD local] → Consta en el documento.
