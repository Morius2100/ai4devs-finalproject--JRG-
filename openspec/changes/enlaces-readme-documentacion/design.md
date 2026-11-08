## Context

El `readme.md` de entrega (unas 800 líneas) menciona rutas en varios formatos: texto en código (`` `docs/…` ``), árbol de ficheros en el §2.3, IDs de spec (`` **Spec:** `votacion` ``) y el marcador `<URL_DEL_REPOSITORIO>`. Después de T2, `docs/` y `openspec/` existirán en el repositorio de entrega, pero `src/` no.

## Goals / Non-Goals

**Goals:**
- Que cada referencia a un fichero o directorio sea un enlace que lleve a algo que existe.
- Que no queden marcadores de plantilla (`<URL_DEL_REPOSITORIO>`).

**Non-Goals:**
- Reescribir contenido técnico del README.
- Enlazar las rutas dentro de bloques de código o del árbol ASCII del §2.3. Ahí se mantiene el texto y se añade debajo una línea con enlaces a los directorios principales.

## Decisions

1. **Enlaces relativos para `docs/` y `openspec/`**, porque funcionan en cualquier rama y en forks. **Enlaces absolutos para el código**, con la forma `https://github.com/Morius2100/ai4devs-finalproject--JRG-/tree/main/...`, porque ese contenido solo existe allí.
2. **Los IDs de spec de las HU** (`descubrimiento-temas`, `votacion`, `notificaciones`) **se enlazan a `openspec/specs/<id>/spec.md`.** Esto se coordina con T4, que añade el resumen de esas mismas líneas.
3. **Verificar con un comprobador de enlaces** (por ejemplo `npx markdown-link-check readme.md`) en vez de revisar a ojo. *Alternativa:* el script `lychee` es más rápido, pero requiere instalar un binario.

## Risks / Trade-offs

- [Enlaces absolutos a `main` del repositorio de código: si una ruta se mueve, el enlace se rompe] → Ejecutar el comprobador de enlaces antes de cada entrega.
- [Si T2 no se aplica, todos los enlaces relativos quedarán rotos] → Las tasks bloquean este change hasta que T2 esté hecho.
