## Context

La documentación existe en tres sitios locales:
- `Opina/` (raíz de trabajo, sin remoto, con cambios sin commitear en `docs/` y `openspec/`);
- `Opina/ai4devs-finalproject--JRG-/` (repositorio de código publicado en GitHub);
- `Opina/AI4Devs-finalproject/` (repositorio de entrega, que no tiene `docs/` ni `openspec/`).

La revisión acepta dos vías: «trae a este repo `docs/` y `openspec/` (o enlaza rutas abiertas)».

## Goals / Non-Goals

**Goals:**
- Que cualquier ruta `docs/…` u `openspec/…` citada en el `readme.md` exista en el repositorio de entrega.
- Que quede claro cuál es la fuente de verdad, para no mantener dos documentaciones divergentes.

**Non-Goals:**
- Copiar el código (`src/`, `tests/`, etc.) al repositorio de entrega.
- Reescribir el contenido de `docs/`; se copia tal cual.

## Decisions

1. **Copiar una instantánea en vez de solo enlazar.** La revisión dice que «quien revise no podrá comprobar esa documentación»: tenerla en el mismo repositorio elimina saltos entre repositorios y hace que los enlaces relativos del README funcionen.
   - *Alternativa 1:* solo enlaces absolutos al repositorio de código. Es válida según la revisión, pero obliga a navegar fuera del repositorio revisado.
   - *Alternativa 2:* submódulo git. Descartado: GitHub lo muestra como un enlace opaco y algunas herramientas de revisión no lo resuelven.
2. **Origen de la copia: el repositorio de código publicado (`ai4devs-finalproject--JRG-`)**, no `Opina/`, porque es lo que está en GitHub y es reproducible por commit. Antes de copiar hay que sincronizar en él los cambios pendientes de `Opina/` (por ejemplo `docs/08-despliegue-vercel.md` y el change `apk-servidor-vercel-por-defecto`).
3. **`docs/README.md` con la procedencia** (repositorio, rama y hash del commit), para que el revisor sepa que es una copia y dónde mirar la versión viva.

## Risks / Trade-offs

- [La copia se desactualiza respecto al repositorio de código] → Registrar el commit de origen y repetir la copia antes de cada entrega (paso en tasks).
- [Se copian por error ficheros privados, como `.env`] → Copiar solo `docs/` y `openspec/` y revisar la lista de ficheros antes del commit.

## Open Questions

- ¿Se sincronizan antes los cambios sin commitear de `Opina/` con `ai4devs-finalproject--JRG-`? Se asume que sí; si no, la copia reflejará el último commit publicado.
