## Context

Hay dos repositorios públicos:

| Repositorio | Contenido | Papel |
| --- | --- | --- |
| `Morius2100/AI4Devs-finalproject` (fork de `LIDR-academy/AI4Devs-finalproject`), rama `feature/entrega-1-JRG` | `readme.md` y `prompts.md` | Repositorio que revisa LIDR |
| `Morius2100/ai4devs-finalproject--JRG-` | Código, `docs/`, `openspec/`, tests, CI | Repositorio del proyecto |

La revisión pide «pon el enlace de este repositorio», es decir, el de entrega. Pero el código vive en el otro.

## Goals / Non-Goals

**Goals:**
- Que el apartado 0.5 no contenga ningún marcador «PENDIENTE».
- Que el revisor llegue desde la ficha a los dos repositorios con un clic.

**Non-Goals:**
- Rellenar el apartado 0.4 (URL desplegada) — es de la entrega final.
- Fusionar los dos repositorios en uno (se valora en `documentacion-visible-entrega`).

## Decisions

1. **Poner las dos URLs y no solo una.** El revisor pide la del repositorio de entrega, pero si solo está esa no se llega al código. *Alternativa descartada:* poner solo la del repositorio de código, que contradice la indicación literal de la revisión.
2. **Enlaces Markdown absolutos con la rama indicada** (`/tree/feature/entrega-1-JRG`), porque la rama `main` del fork no tiene el contenido de la entrega.

## Risks / Trade-offs

- [Si se renombra la rama o el repositorio, el enlace se rompe] → Revisarlo en la tarea de verificación de T3 y antes de cada entrega.
- [El repositorio de entrega tiene cambios sin commitear en `readme.md` (formato Prettier)] → Hacer commit o descartar esos cambios antes de aplicar este change, para que el diff quede limpio.
