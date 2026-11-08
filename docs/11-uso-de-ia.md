# 11 · Uso de IA en el ciclo de desarrollo

Cómo se ha usado la IA en cada fase y dónde se puede comprobar. Responde a la Revisión 1 de LIDR (tarea T9): dejar trazada la IA en implementación y pruebas, además de en análisis y diseño.

**Asistente:** Claude Code (Anthropic), con **OpenSpec** para Spec Driven Development. El contexto fijo del agente está en [`CLAUDE.md`](../CLAUDE.md) (stack, capas, política de visibilidad y regla de que solo `VoteService` escribe votos).

## Fases

| Fase | Uso de la IA | Evidencia |
| --- | --- | --- |
| **Análisis** | Un prompt inicial detallado generó el análisis y el plan por cambios de especificación. | [`prompts.md`](../prompts.md) (sección 1), [`docs/01-producto.md`](01-producto.md), [`docs/04-historias-usuario.md`](04-historias-usuario.md) |
| **Diseño** | Arquitectura, modelo de datos, contrato de la API y tickets salieron de esas conversaciones. | [`docs/02-arquitectura.md`](02-arquitectura.md), [`docs/03-modelo-datos.md`](03-modelo-datos.md), [`docs/05-tickets.md`](05-tickets.md) |
| **Implementación** | Cada cambio se propone con `/opsx:propose` (proposal, design, specs, tasks) y se implementa con `/opsx:apply`, tarea a tarea. | [`openspec/changes/`](../openspec/changes/) (activos y archivados), historial de commits |
| **Pruebas** | La IA derivó los casos de test de los criterios de aceptación y escribió los tests; el humano ejecuta y decide. | [`docs/10-trazabilidad-criterios.md`](10-trazabilidad-criterios.md), `tests/**/criterios-*`, `tests/e2e/accesibilidad.spec.ts` |
| **Despliegue** | Guion de despliegue en Vercel + Neon + Cloudflare R2 y protección del seed. | [`docs/08-despliegue-vercel.md`](08-despliegue-vercel.md), `scripts/vercel-build.mjs` |
| **Revisión de seguridad** | Lectura del código para buscar fallos de confidencialidad. | [`docs/09-revision-seguridad.md`](09-revision-seguridad.md) |

## Cómo comprobarlo en el repositorio

- **Commits hechos con IA:** llevan la línea `Co-Authored-By: Claude …`.
  `git log --grep="Co-Authored-By: Claude" --oneline`
- **Trazabilidad de cada cambio:** el `proposal.md` de cada cambio dice por qué se hace; el `tasks.md` marca lo hecho (`- [x]`); las specs llevan los escenarios que luego son tests.
- **Prompts del humano:** registro automático en `Prompts.md` mediante un hook (`.claude/hooks/log-prompt.cjs`) en el repositorio de código, y selección en [`prompts.md` §8](../prompts.md) del repositorio de entrega.
- **Pruebas:** `grep -rn "CA-07.3" tests` encuentra el test de un criterio concreto.

## Prompts de esta fase (Revisión 1)

Los prompts del humano, tal como se escribieron, en orden. Las respuestas cortas de confirmación («Sí, …») aprobaron la propuesta que hizo la IA justo antes.

| # | Prompt | Resultado |
| --- | --- | --- |
| 1 | «Dentro de docs he creado el documento Revision1. Busca las cosas que el equipo de LIDR comenta para cambiar y mejorar y crea un resumen sobre las tareas que tendriamos que realizar, por ahora no escribas nada de codigo ni modifiques el sistema…» | Lista de tareas T1 a T12, sin tocar nada |
| 2 | `/opsx:propose` «Comprueba que las tareas T1, T2, T3 y T4 no estan implementadas … y en caso de no estarlas crea una spec por tareas no implementarla…» | Cuatro cambios OpenSpec: `ficha-url-repositorio`, `documentacion-visible-entrega`, `enlaces-readme-documentacion`, `resumen-referencias-historias` |
| 3 | `/opsx:apply` «Realiza la implementacion de los 4 Specs … añade tambien donde sea necesario que tenemos la app desplegada en https://ai4devs-finalproject-jrg.vercel.app/» | README de entrega con las URLs, `docs/` y `openspec/` copiados, enlaces y resúmenes de historias |
| 4 | `/opsx:apply` «T6, teniendo en cuenta que vamos a mantener el sistema de amistades, documenta esto para hacer y revisa si realmente existen patrones de seguridad adecuados para proteger la confidencialidad de los usuarios.» | Informe `docs/09` (9 hallazgos) y cambio `amistades-y-confidencialidad` |
| 5 | «Sí, aceptar» · «Sí, implementar» | Decisión de producto (solicitud y aceptación de amistad) e implementación |
| 6 | «Accede a la cuenta de Vercel para aplicar las pruebas sobre la bbDD» | La IA propuso alternativas y el humano eligió PostgreSQL local; no se accedió a Vercel ni a Neon |
| 7 | «Sí, actualizar e2e» · «Pasar al grupo 3» · «Sí, grupo 4» · «Sí, grupo 5» | Límite de intentos, imágenes firmadas, seed protegido, cabeceras de seguridad y sesiones |
| 8 | «Sí, sincronizar» · «Push entrega» | Commits en los dos repositorios; el push solo del repositorio de entrega |
| 9 | «Realiza T5 añadiendo a Claude.md las indicaciones de: el stack, las capas, la política de visibilidad, que es única, la regla de que solo el servicio de votos escribe votos. Segun lo que se definio en el proyecto.» | `CLAUDE.md` con esas cuatro secciones |
| 10 | `/opsx:apply` «Implementa T9, creando los casos de test a partir de los criterios de las historias» | 67 tests que citan su criterio y `docs/10` |
| 11 | «Sí, accesibilidad» | 16 pruebas con axe-core y dos correcciones |
| 12 | «Sí, trazar uso de IA» | Este documento |

## Dónde decidió el humano

La IA propone y ejecuta; estas decisiones fueron del humano:

- **Alcance:** qué tareas de la revisión se hacen y en qué orden.
- **Producto:** aceptar la solicitud y aceptación de amistad (Q-04) y mantener el sistema de amistades.
- **Entorno de pruebas:** usar PostgreSQL local en vez de la base de datos de producción.
- **Publicación:** qué se sube. Los commits se hacen en local y el push se pide aparte; el del repositorio de código despliega en producción y no se ha hecho.

## Dónde se equivocó la IA y cómo se detectó

Registro honesto de errores que se corrigieron, para que se vea la revisión humana y de las propias pruebas:

| Error | Cómo se detectó | Corrección |
| --- | --- | --- |
| La ruta `/api/media` consultaba Prisma directamente, contra la regla de capas | Al contrastar `CLAUDE.md` con el código | Consulta movida a `TopicService.findImageVisibility` |
| Un `docs/Revision1.txt` se subió al repositorio de código al copiar `docs/` | Revisión de la lista de ficheros tras el push | Pendiente de decidir si se borra en un commit nuevo |
| El contador de intentos de registro se acumulaba entre ejecuciones y hacía fallar `auth.test.ts` | Ejecutar la suite varias veces seguidas | Límite desactivado por defecto en las pruebas |
| `aria-label` del logotipo y de las historias no contenían el texto visible (WCAG 2.5.3) | Primera ejecución de axe | Nombre accesible compuesto con texto oculto |
| La documentación de `/api/me/friend-requests/:id` no decía que `:id` es quien envía la solicitud | Revisión del servicio y las rutas al redactar este documento | Aclarado en `docs/02-arquitectura.md` |

## Límites

Una IA puede equivocarse con seguridad. Por eso cada cambio exige pruebas, lint y typecheck en verde, y lo que no se puede comprobar en local se dice así (por ejemplo, el estado real de la base de datos de producción: tarea 4.2 de `amistades-y-confidencialidad`).
