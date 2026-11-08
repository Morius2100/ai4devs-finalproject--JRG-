## Why

La Revisión 1 de LIDR (tarea **T2**, primer paso de «Próximos pasos») señala que el README dice que la documentación completa está en `docs/` y el plan en `openspec/changes/`, pero que el repositorio revisado (`AI4Devs-finalproject`, rama `feature/entrega-1-JRG`) solo contiene `readme.md` y `prompts.md`. Quien revise no puede comprobar la documentación que se cita.

## What Changes

- Copiar al repositorio de entrega una instantánea de `docs/` (incluidos `mockups/`) y `openspec/` (`config.yaml`, `specs/` y `changes/` con `archive/`), tomada del repositorio de código.
- Excluir de la copia los ficheros que no son documentación de entrega: `docs/Revision1.txt`, que es la propia revisión.
- Añadir al principio de `docs/` del repositorio de entrega una nota (`docs/README.md`) que explique que es una copia, cuál es la fuente de verdad (el repositorio de código) y en qué commit se tomó.
- Ajustar la frase del apartado 0.5 del `readme.md` para que diga que la documentación está en este mismo repositorio.

## Capabilities

### New Capabilities
<!-- Ninguna: `documentacion-entrega` se introduce en `ficha-url-repositorio`. -->

### Modified Capabilities
- `documentacion-entrega`: añade el requisito de que la documentación citada en el README sea accesible desde el repositorio de entrega. Si este change se archiva antes que `ficha-url-repositorio`, la capability se crea aquí.

## Impact

- **Afectado:** repositorio `AI4Devs-finalproject` (directorios nuevos `docs/` y `openspec/`, y una frase del `readme.md`).
- **No afectado:** código de la aplicación y repositorio de código, que no se modifica.
- **Habilita:** `enlaces-readme-documentacion` (T3), cuyos enlaces relativos solo funcionan si los ficheros existen en el repositorio de entrega.
