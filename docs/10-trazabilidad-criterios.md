# 10 · Trazabilidad de los criterios de aceptación

Cada criterio de aceptación (`CA-xx.y`) de [`04-historias-usuario.md`](04-historias-usuario.md) con los tests que lo cubren. Los tests nuevos de la tarea T9 citan el criterio en el título (`CA-07.3 · …`), así que se pueden buscar con `grep -rn "CA-07.3" tests`.

**Estado a 8 de noviembre de 2026:** 564 pruebas unitarias y de integración, y 43 e2e. Las pruebas nuevas de T9 son 67 (4 ficheros de componentes y 1 de integración).

Abreviaturas: **U** = `tests/unit/…`, **I** = `tests/integration/…`, **E** = `tests/e2e/…`. Los ficheros nuevos de T9 van en **negrita**.

## Ficheros nuevos de T9

| Fichero | Criterios que cubre |
| --- | --- |
| **U** `components/criterios-autenticacion.test.tsx` | CA-00.1 a CA-00.4 (pantallas de acceso y registro, mensajes de error, 429) |
| **U** `components/criterios-busqueda-opiniones-notificaciones.test.tsx` | CA-01.5, CA-02.1 a CA-02.5, CA-07.1, CA-07.3 a CA-07.5, CA-12.1 a CA-12.4 |
| **U** `components/criterios-votacion.test.tsx` | CA-03.1 a CA-03.5, CA-04.1 a CA-04.4, CA-05.1 a CA-05.3, CA-06.1 a CA-06.3, CA-07.1 |
| **U** `components/criterios-creacion-temas.test.tsx` | CA-08.2 a CA-08.4, CA-09.1 a CA-09.3, CA-10.1, CA-10.3 |
| **I** `criterios-temas.test.ts` | CA-02.2, CA-02.4, CA-02.5, CA-08.2, CA-08.3, CA-09.1, CA-09.3 |

## Por historia

| Criterio | Tests |
| --- | --- |
| **HU-00 · Identificarse** | |
| CA-00.1 registro correcto | **U** criterios-autenticacion · I auth · E identificacion |
| CA-00.2 usuario o email ya existentes | **U** criterios-autenticacion · I auth |
| CA-00.3 inicio de sesión correcto | **U** criterios-autenticacion · I auth, app-token · E identificacion |
| CA-00.4 error genérico | **U** criterios-autenticacion · I auth, rate-limit (mismo trato si el email no existe) · E identificacion |
| CA-00.5 sin sesión → inicio de sesión | I app-token, media · E identificacion |
| CA-00.6 cerrar sesión | E identificacion |
| **HU-01 · Tendencias** | |
| CA-01.1 orden por votos y fecha | I topic-service |
| CA-01.2 título en cada elemento | U TopicListItem |
| CA-01.3 carga continua | I topic-service · U TopicList · E descubrimiento-temas |
| CA-01.4 sin temas privados | I topic-service |
| CA-01.5 estado vacío | **U** criterios-busqueda-opiniones-notificaciones · U TopicList |
| CA-01.6 pulsar un tema | E descubrimiento-temas |
| **HU-02 · Buscar** | |
| CA-02.1 buscador arriba | **U** criterios-busqueda-opiniones-notificaciones |
| CA-02.2 coincidencia parcial sin mayúsculas | I topic-service, **criterios-temas** · E descubrimiento-temas |
| CA-02.3 vaciar vuelve a tendencias | U SearchBar · **U** criterios-busqueda-opiniones-notificaciones · E descubrimiento-temas |
| CA-02.4 sin resultados | **U** criterios-busqueda-opiniones-notificaciones · I topic-service, **criterios-temas** |
| CA-02.5 resultados paginados | **I** criterios-temas · **U** criterios-busqueda-opiniones-notificaciones |
| **HU-03 · Entrar en un tema** | |
| CA-03.1 título | **U** criterios-votacion |
| CA-03.2 imagen en la mitad superior | U TopicView · **U** criterios-votacion · E descubrimiento-temas (depende del estado de la BD local) |
| CA-03.3 sin imagen no reserva espacio | U TopicView · **U** criterios-votacion |
| CA-03.4 botones verde y rojo | U VoteButtons · **U** criterios-votacion |
| CA-03.5 votado: resultados | U TopicView · **U** criterios-votacion · I topic-detail |
| CA-03.6 tema inexistente | U DetailScreens · I topic-detail |
| **HU-04 / HU-05 · Votar y justificar** | |
| CA-04.1 pulsar inicia el voto | U VoteButtons · **U** criterios-votacion |
| CA-04.2 el voto queda registrado | I vote-service · E votacion · **U** criterios-votacion |
| CA-04.3 un solo voto por tema | I vote-service (también concurrente) · **U** criterios-votacion (409) |
| CA-04.4 cancelar | U JustificationDialog · **U** criterios-votacion · E votacion |
| CA-05.1 solicitud de justificación | **U** criterios-votacion |
| CA-05.2 voto con campo vacío | U JustificationDialog · I vote-service · **U** criterios-votacion |
| CA-05.3 hasta 500 caracteres | U JustificationDialog · I vote-service · **U** criterios-votacion |
| CA-05.4 solo espacios = vacío | I vote-service |
| **HU-06 · Resultados** | |
| CA-06.1 sin recargar | **U** criterios-votacion · E votacion |
| CA-06.2 totales con el voto recién emitido | I vote-service · U VoteResults · **U** criterios-votacion |
| CA-06.3 cuentan todos los votos | I vote-service · **U** criterios-votacion · E votacion |
| **HU-07 · Opiniones** | |
| CA-07.1 lista tras votar | **U** criterios-votacion, criterios-busqueda-opiniones-notificaciones · E votacion |
| CA-07.2 verde / rojo | U OpinionItem |
| CA-07.3 autor y justificación | **U** criterios-busqueda-opiniones-notificaciones |
| CA-07.4 orden y carga continua | I opinions · **U** criterios-busqueda-opiniones-notificaciones |
| CA-07.5 sin opiniones | **U** criterios-busqueda-opiniones-notificaciones |
| CA-07.6 sin voto no hay lista | I opinions, visibility-friends |
| **HU-08 / HU-09 / HU-10 · Crear temas** | |
| CA-08.1 opción en el menú | E creacion-temas |
| CA-08.2 título 3–120 y visibilidad | I create-topic, **criterios-temas** · **U** criterios-creacion-temas |
| CA-08.3 queda disponible y lleva al tema | E creacion-temas · **I** criterios-temas · **U** criterios-creacion-temas |
| CA-08.4 título inválido | E creacion-temas · I create-topic · **U** criterios-creacion-temas |
| CA-09.1 imagen opcional, JPEG/PNG/WebP, 4 MB | U image-storage · **U** criterios-creacion-temas · **I** criterios-temas |
| CA-09.2 la imagen se muestra | E creacion-temas, seguridad · **U** criterios-creacion-temas |
| CA-09.3 tipo o tamaño no permitido | U image-storage · **I** criterios-temas · **U** criterios-creacion-temas |
| CA-10.1 elegir «Privado» | **U** criterios-creacion-temas · E temas-privados |
| CA-10.2 no aparece en tendencias ni búsqueda | I create-topic, topic-service |
| CA-10.3 el creador accede | I create-topic, topic-detail · **U** criterios-creacion-temas |
| **HU-11 / HU-12 · Temas privados y notificaciones** | |
| CA-11.1 a CA-11.4 acceso del amigo, del no amigo y del creador | I visibility-friends, friendship-management · U visibility-policy · E temas-privados |
| CA-12.1 una notificación por amigo | I notifications-creation · **U** criterios-busqueda-opiniones-notificaciones |
| CA-12.2 nombre y título | **U** criterios-busqueda-opiniones-notificaciones |
| CA-12.3 acceso y orden | I notifications-list · **U** criterios-busqueda-opiniones-notificaciones |
| CA-12.4 pulsar entra en el tema | **U** criterios-busqueda-opiniones-notificaciones · E temas-privados |
| CA-12.5 el público no notifica | I notifications-creation |
| CA-12.6 los no amigos no reciben | I notifications-creation, friendship-management |
| **HU-13 / HU-14 / HU-15 · Personas y amistades** | |
| CA-13.1 menú inferior | U BottomNav |
| CA-13.2 a CA-13.4 lista, búsqueda y paginación | I user-search · U PeopleScreen · E personas-amistades |
| CA-14.1 a CA-14.5 perfil | I user-topics, user-profile-api · U ProfileScreen, DetailScreens · E personas-amistades |
| CA-15.1 a CA-15.8 amistad con consentimiento | I friendship-management · U ProfileScreen, PeopleScreen, MyFriendsScreen · E personas-amistades |
| **HU-16 / HU-22 · App Android** | |
| CA-16.2 sesión | U platform · I app-token |
| CA-16.3 botón atrás | U native/native |
| CA-16.5 sin conexión | U native/native, native/offline-server |
| CA-16.6 servidor por defecto | U platform/server-store |
| CA-22.1 a CA-22.5 servidor configurable | U native/server-form, server-gating, offline-server · U ServerScreen, ServerLinks · I media |
| **HU-17 a HU-21** | |
| CA-17.1, CA-17.2 fecha relativa | U format/relative-date · U TopicListItem |
| CA-18.1 a CA-18.4 marca de voto | U TopicListItem · I topic-my-vote · E votacion |
| CA-19.1 a CA-19.5 historias | I stories, topic-views · U StoriesBar · E historias |
| CA-20.1 a CA-20.4 editar perfil | I me-update · U EditProfileScreen · E mi-perfil |
| CA-21.1 a CA-21.3 mi perfil | I me · U MyProfileScreen, MyFriendsScreen · E mi-perfil |

## Criterios sin test automático

| Criterio | Motivo |
| --- | --- |
| CA-16.1 la APK lleva todas las pantallas | Hay que construirla y probarla en un dispositivo |
| CA-16.4 pantalla de arranque, barra de estado e icono | Es resultado visual del empaquetado nativo |
| CA-18.1 colores en modo claro y oscuro | Se comprueban las clases, no el render en cada tema |
| CA-03.2 media pantalla de imagen | El e2e existe, pero falla en una base local donde `ana` ya votó ese tema |

## Accesibilidad

[`tests/e2e/accesibilidad.spec.ts`](../tests/e2e/accesibilidad.spec.ts) pasa **axe-core** (reglas WCAG 2.0 y 2.1, niveles A y AA, en el navegador real, con contraste de color) por 16 situaciones: inicio de sesión (con y sin error), registro (con y sin errores), pantalla principal, menú abierto, tema sin votar, diálogo de justificación, tema votado, crear tema (con y sin error), notificaciones, personas, perfil ajeno, mi perfil, editar perfil y mis amigos. Resultado: **sin infracciones**.

La primera ejecución encontró dos infracciones reales de «etiqueta en el nombre» (WCAG 2.5.3), ya corregidas:

- el enlace del logotipo tenía `aria-label="Opina"` pero el texto visible es «pina» (la «O» es un gráfico): ahora el nombre sale de un texto oculto;
- los enlaces de las historias tenían un `aria-label` que no contenía el texto visible (contador y nombre): ahora el nombre se compone con texto oculto más el nombre visible.

Lo que axe no puede comprobar (orden de foco, uso con lector de pantalla, textos alternativos con sentido) sigue necesitando revisión manual. Tampoco hay pruebas automáticas de rendimiento.
