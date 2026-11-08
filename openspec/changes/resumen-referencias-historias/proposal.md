## Why

La Revisión 1 de LIDR (tarea **T4**) indica que «las historias remiten a tickets y especificaciones que no están en este repo, así que conviene resumir en una línea lo imprescindible». Ahora cada historia del §5 del `readme.md` termina con una línea del tipo `**Tickets:** TKT-011, TKT-012, TKT-013, TKT-015 · **Spec:** descubrimiento-temas`, sin decir qué hace cada ticket.

## What Changes

- En cada una de las tres historias del §5 (HU-01, HU-04/HU-05 y HU-12), añadir debajo de la línea de tickets **una línea de resumen** que explique qué cubre cada ticket (capa y propósito) y qué recoge la spec.
- Mantener la línea original de IDs. T3 la convierte en enlaces.

## Capabilities

### New Capabilities
<!-- Ninguna: usa `documentacion-entrega`. -->

### Modified Capabilities
- `documentacion-entrega`: añade el requisito de que las historias de usuario del README se entiendan sin abrir los tickets ni las specs.

## Impact

- **Afectado:** `AI4Devs-finalproject/readme.md` §5.
- **Opcional:** aplicar el mismo criterio a `docs/04-historias-usuario.md`. Queda fuera del alcance, porque allí los tickets están en el mismo repositorio.
- **Coordinación:** `enlaces-readme-documentacion` (T3) toca las mismas líneas. Conviene aplicar T4 antes o después de T3, nunca a la vez.
