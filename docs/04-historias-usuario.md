# 4. Historias de usuario

Formato: _Como_ <rol>, _quiero_ <acción>, _para_ <beneficio>. Cada historia incluye criterios de aceptación (CA) verificables que se trasladan como escenarios a las specs de OpenSpec.

**Roles:** _usuario_ (usuario identificado de Opina), _creador_ (usuario que crea un tema), _amigo_ (usuario presente en la lista de amigos del creador), _visitante_ (persona sin sesión).

## Mapa de épicas

| Épica                        | Historias                  | Cambio SDD                             |
| ---------------------------- | -------------------------- | -------------------------------------- |
| E1 · Plataforma base         | HU-00                      | `fase-1-plataforma-base`               |
| E2 · Descubrimiento de temas | HU-01, HU-02               | `fase-2-listado-busqueda-temas`        |
| E3 · Acceso a un tema        | HU-03                      | `fase-3-detalle-tema`                  |
| E4 · Votación y opiniones    | HU-04, HU-05, HU-06, HU-07 | `fase-4-votacion-opiniones`            |
| E5 · Creación de temas       | HU-08, HU-09, HU-10        | `fase-5-creacion-temas`                |
| E6 · Temas privados          | HU-11, HU-12               | `fase-6-temas-privados-notificaciones` |
| E7 · Personas y amistades    | HU-13, HU-14, HU-15        | `personas-y-amistades`                 |

---

## E1 · Plataforma base

### HU-00 · Identificarse en la aplicación _(habilitante, S-01)_

**Como** visitante, **quiero** registrarme e iniciar sesión, **para** que mis votos, temas, amigos y notificaciones estén asociados a mí.

- **Prioridad:** Must · **Estimación:** 5 pts
- **CA-00.1** Dado un visitante, cuando se registra con nombre de usuario, email y contraseña válidos, entonces se crea su cuenta y queda con la sesión iniciada en la pantalla principal.
- **CA-00.2** Dado un nombre de usuario o email ya existentes, cuando intenta registrarse, entonces se muestra un error y no se crea la cuenta.
- **CA-00.3** Dado un usuario registrado, cuando inicia sesión con credenciales correctas, entonces accede a la pantalla principal.
- **CA-00.4** Dadas credenciales incorrectas, cuando intenta iniciar sesión, entonces se muestra un error genérico.
- **CA-00.5** Dado un visitante, cuando intenta acceder a cualquier pantalla de la aplicación, entonces es redirigido a iniciar sesión.
- **CA-00.6** Dado un usuario con sesión, cuando cierra sesión desde el menú principal, entonces vuelve a la pantalla de inicio de sesión.

---

## E2 · Descubrimiento de temas

### HU-01 · Ver las tendencias

**Como** usuario, **quiero** ver al entrar una lista scrolleable con los temas de mayor tendencia, **para** encontrar rápidamente temas sobre los que opinar.

- **Prioridad:** Must · **Estimación:** 5 pts
- **CA-01.1** Dado que el usuario entra en la aplicación y no ha buscado nada, entonces ve una lista de temas públicos ordenados por número total de votos descendente y, a igualdad, por más recientes (S-04).
- **CA-01.2** Cada elemento de la lista muestra el título del tema.
- **CA-01.3** Cuando el usuario llega al final de la lista y hay más temas, entonces se cargan los siguientes (scroll continuo).
- **CA-01.4** Los temas privados no aparecen en la lista (S-06).
- **CA-01.5** Si no hay temas, se muestra un estado vacío.
- **CA-01.6** Cuando el usuario pulsa un tema, entonces navega a la pantalla de ese tema.

### HU-02 · Buscar temas

**Como** usuario, **quiero** un buscador en la parte superior de la pantalla principal, **para** encontrar temas concretos.

- **Prioridad:** Must · **Estimación:** 3 pts
- **CA-02.1** El buscador está situado en la parte superior de la pantalla principal.
- **CA-02.2** Cuando el usuario escribe un texto, entonces la lista muestra los temas públicos cuyo título contiene ese texto, sin distinguir mayúsculas/minúsculas (S-08).
- **CA-02.3** Cuando el usuario vacía el buscador, entonces la lista vuelve a mostrar las tendencias.
- **CA-02.4** Si la búsqueda no tiene resultados, se muestra un mensaje de "sin resultados".
- **CA-02.5** Los resultados de búsqueda también se muestran en lista scrolleable con carga continua.

---

## E3 · Acceso a un tema

### HU-03 · Entrar en un tema

**Como** usuario, **quiero** entrar en un tema y ver su título, su imagen (si la tiene) y los botones de voto, **para** decidir mi opinión.

- **Prioridad:** Must · **Estimación:** 3 pts
- **CA-03.1** Al entrar en un tema se muestra su título.
- **CA-03.2** Si el tema tiene imagen adjunta, se muestra en la parte superior ocupando la mitad superior de la pantalla del móvil.
- **CA-03.3** Si el tema no tiene imagen, no se reserva el espacio de imagen.
- **CA-03.4** Si el usuario aún no ha votado, en la parte inferior aparecen dos botones: pulgar arriba verde y pulgar abajo rojo.
- **CA-03.5** Si el usuario ya votó ese tema, en lugar de los botones se muestran los resultados (HU-06, HU-07) (S-03).
- **CA-03.6** Si el tema no existe, se muestra una pantalla de "tema no encontrado".

---

## E4 · Votación y opiniones

### HU-04 · Votar un tema

**Como** usuario, **quiero** votar a favor (pulgar arriba) o en contra (pulgar abajo) de un tema, **para** expresar mi opinión.

- **Prioridad:** Must · **Estimación:** 5 pts
- **CA-04.1** Cuando el usuario pulsa uno de los dos botones, entonces se inicia el proceso de votación con el valor elegido (positivo o negativo).
- **CA-04.2** Cuando el usuario finaliza el proceso, entonces su voto queda registrado.
- **CA-04.3** Un usuario solo puede emitir un voto por tema; un segundo intento es rechazado (S-03).
- **CA-04.4** Si el usuario cancela el proceso antes de confirmarlo, no se registra ningún voto y siguen visibles los dos botones.

### HU-05 · Justificar el voto (opcional)

**Como** usuario, **quiero** que se me pida una justificación al votar, pudiendo omitirla, **para** explicar mi opinión solo si quiero.

- **Prioridad:** Must · **Estimación:** 3 pts
- **CA-05.1** Tras pulsar un botón de voto se muestra una solicitud de justificación con un campo de texto.
- **CA-05.2** El usuario puede confirmar el voto con el campo vacío.
- **CA-05.3** El usuario puede confirmar el voto con una justificación de hasta 500 caracteres.
- **CA-05.4** Una justificación compuesta solo por espacios se trata como vacía.

### HU-06 · Ver los resultados tras votar

**Como** usuario que ha votado, **quiero** ver el total de votos positivos y negativos, **para** conocer la opinión general.

- **Prioridad:** Must · **Estimación:** 2 pts
- **CA-06.1** Tras emitir el voto, los dos botones se transforman en la vista de resultados sin recargar la página.
- **CA-06.2** La vista de resultados muestra el total de votos positivos y el total de votos negativos, incluyendo el voto recién emitido.
- **CA-06.3** Los totales cuentan todos los votos, con o sin justificación.

### HU-07 · Ver las opiniones de otros usuarios

**Como** usuario que ha votado, **quiero** ver la lista de opiniones de los usuarios que han comentado, coloreadas según su voto, **para** entender sus argumentos.

- **Prioridad:** Must · **Estimación:** 3 pts
- **CA-07.1** Tras votar se muestra la lista de opiniones (votos con justificación) del tema (S-05).
- **CA-07.2** Cada opinión se muestra en verde si su autor votó positivo y en rojo si votó negativo.
- **CA-07.3** Cada opinión muestra el nombre de usuario de su autor y su justificación.
- **CA-07.4** La lista es scrolleable, de más reciente a más antigua, con carga continua.
- **CA-07.5** Si nadie ha comentado, se indica que aún no hay opiniones.
- **CA-07.6** Un usuario que no ha votado no puede obtener la lista de opiniones.

---

## E5 · Creación de temas

### HU-08 · Crear un tema público

**Como** usuario, **quiero** crear un tema desde el menú principal, **para** que otros usuarios lo voten.

- **Prioridad:** Must · **Estimación:** 5 pts
- **CA-08.1** El menú principal ofrece la opción de crear un tema.
- **CA-08.2** El formulario solicita un título (obligatorio, 3–120 caracteres) y la visibilidad (pública o privada).
- **CA-08.3** Cuando el usuario crea un tema público válido, entonces el tema queda disponible para todos los usuarios en la lista y la búsqueda, y el creador es llevado a la pantalla del tema.
- **CA-08.4** Si el título no es válido, se muestra el error y no se crea el tema.

### HU-09 · Adjuntar una imagen al tema

**Como** creador, **quiero** adjuntar opcionalmente una imagen al tema, **para** hacerlo más atractivo.

- **Prioridad:** Must · **Estimación:** 5 pts
- **CA-09.1** El formulario permite adjuntar una imagen de forma opcional (JPEG, PNG o WebP, máximo 5 MB).
- **CA-09.2** Un tema creado con imagen la muestra en su pantalla según HU-03.
- **CA-09.3** Un archivo de tipo o tamaño no permitido se rechaza con un mensaje y no se crea el tema.

### HU-10 · Crear un tema privado

**Como** creador, **quiero** marcar un tema como privado, **para** que solo mis amigos puedan votarlo.

- **Prioridad:** Must · **Estimación:** 2 pts
- **CA-10.1** El formulario permite elegir "Privado".
- **CA-10.2** Un tema privado no aparece en la lista de tendencias ni en la búsqueda (S-06).
- **CA-10.3** Tras crearlo, el creador es llevado a la pantalla del tema y puede acceder a él.

---

## E6 · Temas privados

### HU-11 · Restringir el acceso a los amigos del creador

**Como** creador de un tema privado, **quiero** que solo mi lista de amigos pueda acceder a la votación, **para** opinar en un círculo cerrado.

- **Prioridad:** Must · **Estimación:** 3 pts
- **CA-11.1** Un amigo del creador puede entrar en el tema privado, votar y ver los resultados y opiniones.
- **CA-11.2** Un usuario que no es amigo del creador no puede ver el tema; recibe "tema no encontrado".
- **CA-11.3** Un usuario que no es amigo no puede votar ni obtener opiniones del tema, aunque conozca su identificador.
- **CA-11.4** El creador siempre puede acceder a su propio tema privado.

### HU-12 · Notificar a los amigos de un nuevo tema privado

**Como** amigo de un creador, **quiero** recibir una notificación cuando cree un tema privado, **para** poder votarlo.

- **Prioridad:** Must · **Estimación:** 5 pts
- **CA-12.1** Cuando un usuario crea un tema privado, cada uno de sus amigos recibe una notificación indicando que un amigo ha creado una nueva propuesta.
- **CA-12.2** La notificación muestra el nombre del amigo creador y el título del tema.
- **CA-12.3** El menú principal da acceso a la pantalla de notificaciones, ordenadas de más reciente a más antigua.
- **CA-12.4** Al pulsar una notificación, el usuario entra en el tema privado.
- **CA-12.5** Crear un tema público no genera notificaciones.
- **CA-12.6** Los usuarios que no son amigos del creador no reciben notificación.

---

## E7 · Personas y amistades

### HU-13 · Buscar personas

**Como** usuario, **quiero** una sección de personas en la que buscar a otros usuarios, **para** encontrar a quien quiero añadir como amigo.

- **Prioridad:** Must · **Estimación:** 5 pts
- **CA-13.1** Un menú inferior permite cambiar entre **Temas** (pantalla por defecto) y **Personas**, marcando la sección activa.
- **CA-13.2** La pantalla Personas lista a todos los usuarios salvo a uno mismo, en orden alfabético, con su foto de perfil (o su inicial), su nombre y un indicador «Amigo» / «No amigo».
- **CA-13.3** Un buscador, con el mismo aspecto que el de temas, filtra la lista por nombre de usuario (coincidencia parcial, sin distinguir mayúsculas/minúsculas).
- **CA-13.4** La lista se carga de 20 en 20 al hacer scroll, sin repetir personas.

### HU-14 · Ver el perfil de una persona

**Como** usuario, **quiero** ver el perfil de una persona y los temas que ha creado, **para** conocerla antes de añadirla y encontrar sus temas.

- **Prioridad:** Must · **Estimación:** 5 pts
- **CA-14.1** Al pulsar una persona de la lista se abre su perfil.
- **CA-14.2** En la parte superior aparecen su foto de perfil (o su inicial), su nombre y una breve descripción si la tiene.
- **CA-14.3** Debajo de la sección de amistad aparecen los temas que ha creado: los públicos siempre y los privados solo si soy su amigo (marcados como «Privado»).
- **CA-14.4** Justo encima de los temas puedo ordenarlos por «Más recientes» (por defecto) o «Más puntuados» (votos totales).
- **CA-14.5** Si la persona no existe, se muestra «Persona no encontrada».

### HU-15 · Añadir y quitar amigos

**Como** usuario, **quiero** añadir o quitar a una persona de mis amigos desde su perfil, **para** decidir quién accede a mis temas privados.

- **Prioridad:** Must · **Estimación:** 3 pts
- **CA-15.1** El perfil muestra un check que indica si somos amigos; al pulsarlo sin serlo, pasamos a ser amigos mutuamente, sin solicitud.
- **CA-15.2** Al pulsarlo siendo amigos, dejamos de serlo ambos.
- **CA-15.3** El cambio se aplica de inmediato al acceso a temas privados y a las notificaciones de nuevos temas privados.
- **CA-15.4** No puedo añadirme a mí mismo: en mi propio perfil no aparece el check.
- **CA-15.5** Si la operación falla, el check vuelve a su estado anterior y se muestra un error; repetirla no crea duplicados.

## E8 · App móvil

### HU-16 · Usar Opina como app Android

**Como** usuario, **quiero** instalar Opina en mi móvil Android como una app, **para** usarla sin abrir el navegador.

- **Prioridad:** Should · **Estimación:** 8 pts
- **CA-16.1** La app lleva dentro todas las pantallas de Opina y funciona sin el ordenador de desarrollo, contra la API desplegada, con las mismas funciones y reglas que la web.
- **CA-16.2** La sesión se inicia con email y contraseña, se conserva al cerrar y reabrir la app, y se pierde al cerrar sesión o cuando la API la rechaza.
- **CA-16.3** El botón «atrás» de Android vuelve a la pantalla anterior y, en la pantalla principal, cierra la app.
- **CA-16.4** Al arrancar se ve una pantalla verde con el logotipo; la barra de estado y el icono del lanzador usan la marca.
- **CA-16.5** Sin conexión, o si la API no responde, se muestra «Sin conexión» con un botón «Reintentar», y la pantalla se recarga al volver la red.

### HU-22 · Usar la app de desarrollo en la red local sin cable

**Como** desarrollador, **quiero** que la app de desarrollo funcione contra el servidor de mi PC por la red local y sin cable USB, **para** probarla en el móvil sin `adb reverse` ni recompilar cuando cambia la IP.

- **Prioridad:** Could · **Estimación:** 8 pts
- **CA-22.1** En el build de desarrollo puedo configurar la dirección del servidor desde la app (por ejemplo, `http://192.168.5.101:3000`), que se conserva al reabrirla; el APK de desarrollo admite HTTP sin cifrar y el de producción no.
- **CA-22.2** Antes de guardar la dirección, la app comprueba que el servidor responde; si no, muestra un error y mantiene el servidor anterior.
- **CA-22.3** Cambiar de servidor cierra la sesión, porque el token pertenece al servidor anterior.
- **CA-22.4** Las fotos y las imágenes de los temas se cargan a través de la propia API (`/api/media`), sin que el móvil necesite acceso directo al almacenamiento de imágenes.
- **CA-22.5** En el build de desarrollo, la pantalla «Sin conexión» muestra el servidor en uso y permite cambiarlo (con o sin sesión iniciada), con las mismas comprobaciones, para no quedar bloqueado si el servidor no responde.

## E9 · Tarjetas de tema

### HU-17 · Ver cuándo se creó un tema

**Como** usuario, **quiero** ver la fecha de creación de cada tema en su tarjeta, **para** saber si es reciente sin abrirlo.

- **Prioridad:** Should · **Estimación:** 2 pts
- **CA-17.1** Cada tarjeta muestra la fecha de creación justo al lado del total de votos.
- **CA-17.2** La fecha es relativa y corta si es reciente («ahora», «hace 5 min», «hace 3 h», «hace 2 d») y una fecha corta a partir de 7 días («12 sept», con el año si no es el actual).

### HU-18 · Distinguir los temas que ya he votado

**Como** usuario, **quiero** que los temas que ya he votado se distingan en las listas, **para** saber de un vistazo en cuáles he participado y cómo.

- **Prioridad:** Should · **Estimación:** 5 pts
- **CA-18.1** La tarjeta de un tema votado a favor tiene fondo verde suave y la de uno votado en contra, rojo suave, en modo claro y oscuro.
- **CA-18.2** En esos casos la tarjeta muestra, junto al total de votos, los votos a favor y en contra con su icono de pulgar, y una etiqueta accesible con mi voto.
- **CA-18.3** Los temas no votados mantienen el fondo neutro y no muestran el desglose.
- **CA-18.4** Aplica igual en tendencias, búsqueda y temas del perfil de una persona, y se actualiza al votar sin recargar la aplicación.

## E10 · Historias

### HU-19 · Ver los temas nuevos de mis amigos

**Como** usuario, **quiero** ver en la pantalla de temas unas burbujas con los temas nuevos de mis amigos, **para** no perderme lo que acaban de crear.

- **Prioridad:** Should · **Estimación:** 8 pts
- **CA-19.1** Sobre la lista aparece una fila de burbujas, una por amigo con temas pendientes, con su foto o inicial y su nombre; si tiene varios pendientes, un contador. Sin pendientes, no aparece la fila.
- **CA-19.2** Las burbujas van ordenadas por el tema pendiente más reciente y la fila se oculta mientras hay una búsqueda activa.
- **CA-19.3** Un tema está pendiente si lo creó un amigo (público o privado) en las últimas 24 horas y aún no lo he abierto. Mis propios temas nunca cuentan.
- **CA-19.4** Al pulsar una burbuja se abre el tema pendiente más antiguo de ese amigo; al volver, la burbuja desaparece o pasa al siguiente.
- **CA-19.5** Abrir un tema ajeno, venga de donde venga, lo marca como visto, una sola vez.

## E11 · Mi perfil

### HU-20 · Editar mi foto y mi descripción

**Como** usuario, **quiero** cambiar mi foto de perfil y mi descripción, **para** que los demás me reconozcan.

- **Prioridad:** Should · **Estimación:** 5 pts
- **CA-20.1** Desde «Editar perfil» puedo elegir una foto nueva (JPEG, PNG o WebP de hasta 5 MB) con vista previa, o quitar la actual.
- **CA-20.2** Puedo editar la descripción, de hasta 160 caracteres, con un contador de los restantes; vacía, se elimina.
- **CA-20.3** Al guardar vuelvo a mi perfil con los datos nuevos, que se ven también en Personas, en el perfil que ven los demás y en las historias.
- **CA-20.4** Si la foto no es válida o es demasiado grande se muestra el error junto al campo y no cambia nada; «Cancelar» vuelve sin cambios.

### HU-21 · Ver mi perfil, mis amigos y mis temas

**Como** usuario, **quiero** una pestaña con mi perfil, **para** ver mis datos, mis amigos y los temas que he creado.

- **Prioridad:** Should · **Estimación:** 5 pts
- **CA-21.1** El menú inferior tiene una tercera pestaña, Perfil. Mi perfil muestra mi foto, nombre, descripción y los contadores de temas y amigos.
- **CA-21.2** El contador de amigos abre mi lista de amigos (la misma que seguidos y seguidores, al ser la amistad mutua), alfabética y con scroll infinito.
- **CA-21.3** «Mis temas» lista todos mis temas, también los privados, con el selector «Más recientes / Más puntuados».

---

## Resumen

| HU    | Título                          | Pts    | Épica |
| ----- | ------------------------------- | ------ | ----- |
| HU-00 | Identificarse en la aplicación  | 5      | E1    |
| HU-01 | Ver las tendencias              | 5      | E2    |
| HU-02 | Buscar temas                    | 3      | E2    |
| HU-03 | Entrar en un tema               | 3      | E3    |
| HU-04 | Votar un tema                   | 5      | E4    |
| HU-05 | Justificar el voto              | 3      | E4    |
| HU-06 | Ver resultados tras votar       | 2      | E4    |
| HU-07 | Ver opiniones de otros usuarios | 3      | E4    |
| HU-08 | Crear un tema público           | 5      | E5    |
| HU-09 | Adjuntar una imagen al tema     | 5      | E5    |
| HU-10 | Crear un tema privado           | 2      | E5    |
| HU-11 | Acceso restringido a amigos     | 3      | E6    |
| HU-12 | Notificar a los amigos          | 5      | E6    |
| HU-13 | Buscar personas                 | 5      | E7    |
| HU-14 | Ver el perfil de una persona    | 5      | E7    |
| HU-15 | Añadir y quitar amigos          | 3      | E7    |
| HU-16 | Usar Opina como app Android     | 8      | E8    |
| HU-17 | Ver cuándo se creó un tema      | 2      | E9    |
| HU-18 | Distinguir los temas ya votados | 5      | E9    |
| HU-19 | Ver los temas nuevos de amigos  | 8      | E10   |
| HU-20 | Editar mi foto y descripción    | 5      | E11   |
| HU-21 | Ver mi perfil, amigos y temas   | 5      | E11   |
| HU-22 | App de desarrollo en red local  | 8      | E8    |
|       | **Total**                       | **103** |      |
