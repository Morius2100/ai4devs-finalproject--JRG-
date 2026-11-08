## Why

La Revisión 1 de LIDR (tarea **T3**, derivada del apartado 01) advierte que el README apunta a `docs/` y `openspec/changes/` sin que el revisor pueda abrirlos. Ahora las rutas aparecen como texto plano (por ejemplo `docs/06-stack.md` y `docs/02-arquitectura.md` en el §1.4), y la instalación usa el marcador `git clone <URL_DEL_REPOSITORIO>`. Aunque los ficheros existan (T2), el revisor tiene que buscarlos a mano.

## What Changes

- Convertir en enlaces Markdown relativos todas las referencias a ficheros de `docs/` y `openspec/` del `readme.md` del repositorio de entrega (§0.5, §1.4, §2.3, §5 y siguientes).
- Convertir las referencias a código (`src/…`, `prisma/…`, `.github/workflows`) en enlaces absolutos al repositorio de código, porque el código no se copia al repositorio de entrega.
- Sustituir `<URL_DEL_REPOSITORIO>` en las instrucciones de instalación (§1.4) por la URL real del repositorio de código.
- Revisar las frases que remiten a rutas o fases ya superadas, por ejemplo «Se validarán al terminar la fase 1», y actualizarlas o eliminarlas.

## Capabilities

### New Capabilities
<!-- Ninguna: usa `documentacion-entrega`. -->

### Modified Capabilities
- `documentacion-entrega`: añade el requisito de que toda referencia a documentación o código del README sea un enlace navegable y válido.

## Impact

- **Afectado:** `AI4Devs-finalproject/readme.md`.
- **Depende de:** `documentacion-visible-entrega` (T2), porque los enlaces relativos necesitan que existan `docs/` y `openspec/`, y `ficha-url-repositorio` (T1), porque comparten la URL del repositorio de código.
