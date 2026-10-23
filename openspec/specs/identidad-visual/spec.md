## Purpose

Identidad visual común de Opina: paleta de marca (amarillo y verde) como tokens de tema, significado de color del voto, tipografía y formas redondeadas, temas en forma de tarjeta, accesibilidad y uso táctil, y modo oscuro coherente. Es transversal a todas las pantallas. Origen: transversal a HU-00–HU-12 de la definición del producto.

## Requirements

### Requirement: Paleta de marca común

El sistema SHALL aplicar en todas las pantallas una paleta de marca única: amarillo de marca para la cabecera, verde de marca para la acción principal de cada pantalla, gris claro para superficies secundarias (campos, chips) y texto casi negro sobre fondo blanco. Los colores SHALL definirse como tokens de tema reutilizables y no como valores sueltos en cada componente. Origen: transversal a HU-00–HU-12 (docs/01-producto.md, docs/02-arquitectura.md).

#### Scenario: Cabecera con color de marca
- **WHEN** un usuario con sesión abre la pantalla principal, la de crear tema o la de notificaciones
- **THEN** la cabecera se muestra con el fondo amarillo de marca y el nombre "Opina" en verde de marca

#### Scenario: Acción principal destacada
- **WHEN** el usuario abre el formulario de login, registro o crear tema
- **THEN** el botón de envío se muestra en verde de marca con texto blanco y forma de píldora

### Requirement: Significado de color del voto

El sistema SHALL conservar el verde para el voto a favor y el rojo para el voto en contra en botones de voto, resultados, diálogo de justificación y opiniones, y SHALL acompañar siempre el color de un icono o etiqueta accesible para no depender solo de él. El verde de marca de las acciones generales SHALL NOT sustituir al verde del voto a favor. Origen: HU-03 (CA-03.4), HU-04 (CA-04.1), HU-07.

#### Scenario: Botones de voto tras el rediseño
- **WHEN** el usuario abre un tema que aún no ha votado
- **THEN** en la parte inferior aparecen un botón verde de pulgar arriba y uno rojo de pulgar abajo, cada uno con su etiqueta accesible

#### Scenario: Opinión en contra
- **WHEN** se muestra una opinión con voto negativo
- **THEN** la opinión se presenta con borde rojo y el icono de pulgar abajo

### Requirement: Tipografía y formas

El sistema SHALL usar una única familia tipográfica sans-serif redondeada, servida desde el propio dominio, con títulos en negrita, y SHALL presentar botones, campos de texto, buscador y chips con esquinas totalmente redondeadas (píldora), y tarjetas y diálogos con esquinas redondeadas amplias. Origen: transversal a HU-00–HU-12.

#### Scenario: Fuente cargada sin terceros en tiempo de ejecución
- **WHEN** el navegador carga cualquier pantalla de Opina
- **THEN** la fuente se descarga desde el mismo origen que la aplicación y no desde un dominio de terceros

#### Scenario: Buscador en píldora
- **WHEN** el usuario abre la pantalla principal
- **THEN** el buscador aparece como un campo blanco en forma de píldora dentro de la cabecera amarilla

### Requirement: Temas en forma de tarjeta

El sistema SHALL mostrar cada tema de la lista de tendencias o de búsqueda como una tarjeta pulsable que incluye el título, una miniatura de la imagen si el tema la tiene y el número total de votos. Un tema sin imagen SHALL mostrarse sin miniatura ni hueco vacío equivalente a una imagen rota. El orden y el contenido de la lista SHALL NOT cambiar. En la web, la dirección anterior `/temas/<id>` SHALL redirigir de forma permanente a `/tema?id=<id>`. Origen: HU-01, HU-02, HU-16 (CA-16.1).

#### Scenario: Tema con imagen en la lista
- **WHEN** la lista de tendencias incluye un tema con imagen y 12 votos
- **THEN** su tarjeta muestra la miniatura, el título y el indicador "12 votos", y al pulsarla se abre `/tema?id=<id>`

#### Scenario: Tema sin imagen en la lista
- **WHEN** la lista incluye un tema sin imagen
- **THEN** su tarjeta muestra un marcador visual neutro con la inicial del título en lugar de la miniatura

#### Scenario: Enlace antiguo a un tema en la web
- **WHEN** el usuario abre en el navegador `/temas/{id}` de un tema existente
- **THEN** el sistema lo redirige a `/tema?id={id}` y muestra el tema

### Requirement: Accesibilidad y uso táctil

El sistema SHALL mantener un contraste mínimo de 4.5:1 entre el texto normal y su fondo, un área táctil mínima de 44 × 44 px en todo elemento interactivo y un indicador de foco visible con teclado. El texto SHALL NOT mostrarse en amarillo de marca sobre fondo blanco. Origen: docs/02-arquitectura.md (mobile-first), transversal a HU-00–HU-12.

#### Scenario: Navegación con teclado
- **WHEN** el usuario recorre la pantalla principal con la tecla Tab
- **THEN** cada enlace, botón y campo enfocado muestra un anillo de foco visible

#### Scenario: Área táctil de la tarjeta
- **WHEN** se renderiza una tarjeta de tema en un móvil de 375 px de ancho
- **THEN** su altura pulsable es de al menos 44 px

### Requirement: Modo oscuro coherente

El sistema SHALL adaptar la paleta al modo oscuro del sistema operativo (fondo gris muy oscuro, superficies ligeramente más claras, texto claro) conservando el amarillo y el verde de marca como acentos y el significado verde/rojo del voto. Origen: transversal a HU-00–HU-12.

#### Scenario: Preferencia de modo oscuro
- **WHEN** el dispositivo del usuario tiene activado el modo oscuro y abre la pantalla principal
- **THEN** el fondo de la pantalla es oscuro, el texto es claro y la cabecera mantiene el acento de marca con contraste suficiente

### Requirement: Bloques de voto en la pantalla de un tema

El sistema SHALL presentar los dos botones de voto de un tema no votado como dos bloques grandes, uno junto al otro, fijos en la parte inferior de la pantalla: a la izquierda el bloque verde de pulgar arriba con el texto "A favor" y a la derecha el bloque rojo de pulgar abajo con el texto "En contra". Cada bloque SHALL medir al menos 96 px de alto, mostrar un icono de pulgar y su texto, conservar su etiqueta accesible ("Votar a favor" / "Votar en contra") y dejar libre el área segura inferior del dispositivo. Origen: HU-03 (CA-03.4), HU-04 (CA-04.1).

#### Scenario: Tema aún no votado
- **WHEN** el usuario abre un tema que no ha votado en un móvil de 390 × 844 px
- **THEN** en la parte inferior aparecen dos bloques de al menos 96 px de alto: el verde con pulgar arriba y el texto "A favor" y el rojo con pulgar abajo y el texto "En contra"

#### Scenario: Pulsar un bloque inicia el voto
- **WHEN** el usuario pulsa el bloque "En contra"
- **THEN** se abre el diálogo de justificación del voto negativo, igual que con el botón anterior

### Requirement: Bloques de resultados tras votar

El sistema SHALL sustituir, tras votar, los bloques de voto por dos bloques de resultados situados bajo el título del tema: el de la izquierda para los votos a favor (verde) y el de la derecha para los votos en contra (rojo). Cada bloque SHALL mostrar el porcentaje redondeado a entero y el número total de votos de su lado. El bloque correspondiente al voto del usuario SHALL mostrarse relleno con su color y la etiqueta "Tu voto"; el otro SHALL mostrarse en un tono claro del mismo color. Los porcentajes de ambos bloques SHALL sumar 100. Origen: HU-06 (CA-06.1–CA-06.3), HU-03 (CA-03.5).

#### Scenario: Resultados con voto positivo propio
- **WHEN** un tema tiene 5 votos positivos y 2 negativos y el voto del usuario es positivo
- **THEN** el bloque verde aparece relleno con "71 %", "5 votos" y "Tu voto", y el bloque rojo aparece en tono claro con "29 %" y "2 votos"

#### Scenario: Un único voto
- **WHEN** el usuario emite el primer voto de un tema y es negativo
- **THEN** el bloque rojo muestra "100 %", "1 voto" y "Tu voto", y el bloque verde muestra "0 %" y "0 votos"

#### Scenario: Opiniones bajo los resultados
- **WHEN** el usuario ha votado un tema con opiniones
- **THEN** la lista de opiniones aparece debajo de los bloques de resultados y se desplaza con el contenido de la pantalla

### Requirement: Logotipo de Opina

El sistema SHALL identificar la aplicación con un logotipo formado por un símbolo (la letra "O" dibujada como un anillo con cola de bocadillo de diálogo en su parte inferior izquierda) y, en su forma completa, el símbolo seguido del texto "pina" en la tipografía de la marca, leído como "Opina". El logotipo completo SHALL mostrarse en la cabecera de las pantallas con sesión y en la cabecera de las pantallas de inicio de sesión y registro, en lugar del nombre en texto, con el color de texto previsto para el fondo amarillo de marca en modo claro y oscuro. El logotipo SHALL ser un gráfico vectorial y SHALL exponer "Opina" como nombre accesible, sin que el símbolo ni las letras se anuncien por separado. El símbolo SHALL usarse como favicon (símbolo amarillo de marca sobre cuadrado verde de marca redondeado) y como icono de pantalla de inicio de 180 × 180 px. Origen: transversal a HU-00–HU-12 (identidad de la aplicación).

#### Scenario: Logotipo en la cabecera
- **WHEN** un usuario con sesión abre la pantalla principal
- **THEN** la cabecera amarilla muestra el símbolo de la "O" bocadillo seguido de "pina", y pulsarlo lleva a la pantalla principal

#### Scenario: Nombre accesible del logotipo
- **WHEN** un lector de pantalla recorre la cabecera
- **THEN** el enlace del logotipo se anuncia como "Opina"

#### Scenario: Logotipo en las pantallas de identificación
- **WHEN** un visitante abre `/login` o `/registro`
- **THEN** la cabecera amarilla muestra el logotipo completo en lugar del texto "Opina" y la página mantiene un encabezado principal con el nombre "Opina"

#### Scenario: Favicon de la aplicación
- **WHEN** el navegador carga cualquier pantalla de Opina
- **THEN** la pestaña muestra el símbolo de la "O" bocadillo en amarillo sobre fondo verde, y no el icono por defecto de Next.js

#### Scenario: Icono de pantalla de inicio
- **WHEN** un dispositivo iOS solicita el icono de la aplicación
- **THEN** el sistema sirve una imagen PNG de 180 × 180 px con el símbolo sobre fondo verde de marca

### Requirement: Pantallas de identificación centradas

El sistema SHALL mostrar las pantallas `/login` y `/registro` con la cabecera amarilla de marca y el logotipo en la parte superior, y la tarjeta del formulario debajo. La tarjeta SHALL NOT solapar la cabecera. La tarjeta SHALL quedar centrada en horizontal y en vertical dentro del espacio disponible bajo la cabecera. Cuando el contenido no quepa en la pantalla, la pantalla SHALL desplazarse sin que la tarjeta se superponga a la cabecera ni quede recortada. Origen: HU-00 (CA-00.1, CA-00.3).

#### Scenario: Tarjeta de login centrada en un móvil
- **WHEN** un visitante abre `/login` en un móvil de 390 × 844 px
- **THEN** el borde superior de la tarjeta queda por debajo del borde inferior de la cabecera amarilla
- **AND** la distancia entre la cabecera y la tarjeta difiere en menos de 16 px de la distancia entre la tarjeta y el borde inferior de la pantalla

#### Scenario: Registro con más campos
- **WHEN** un visitante abre `/registro` en un móvil de 390 × 844 px
- **THEN** la tarjeta no solapa la cabecera y queda centrada en el espacio restante con el mismo criterio que en `/login`

#### Scenario: Pantalla baja o teclado abierto
- **WHEN** la altura disponible es menor que la de la cabecera más la tarjeta (por ejemplo, 390 × 500 px)
- **THEN** la tarjeta empieza justo debajo de la cabecera, sin solaparla, y el usuario puede desplazarse hasta el botón de envío

### Requirement: Fecha de creación en la tarjeta de tema

El sistema SHALL mostrar en cada tarjeta de tema (tendencias, búsqueda y temas de un perfil) la fecha de creación del tema, justo al lado del chip con el número de votos y con el mismo estilo de chip. La fecha SHALL expresarse así:

- menos de 1 minuto: «ahora»;
- menos de 1 hora: «hace N min»;
- menos de 24 horas: «hace N h»;
- menos de 7 días: «hace N d»;
- a partir de 7 días: día y mes abreviado («12 sept»), con el año si no es el año en curso («12 sept 2025»).

La fecha SHALL marcarse como `<time>` con la fecha completa en `dateTime` y SHALL anunciarse a tecnologías de asistencia como «Creado …». Origen: HU-17 (CA-17.1, CA-17.2).

#### Scenario: Tema reciente
- **WHEN** la lista de tendencias incluye un tema con 12 votos creado hace 3 horas
- **THEN** su tarjeta muestra los chips «12 votos» y «hace 3 h», uno junto al otro

#### Scenario: Tema de hace más de una semana
- **WHEN** hoy es 30 de septiembre de 2026 y un tema se creó el 12 de septiembre de 2026
- **THEN** su tarjeta muestra el chip «12 sept»

#### Scenario: Tema de otro año
- **WHEN** hoy es 30 de septiembre de 2026 y un tema se creó el 3 de marzo de 2025
- **THEN** su tarjeta muestra el chip «3 mar 2025»

#### Scenario: Fecha accesible
- **WHEN** un lector de pantalla recorre la tarjeta de un tema creado hace 5 minutos
- **THEN** anuncia «Creado hace 5 min»

### Requirement: Tarjeta de un tema ya votado

El sistema SHALL marcar en todas las listas de temas las tarjetas de los temas que el usuario ya ha votado:

- fondo verde suave si su voto fue a favor, y rojo suave si fue en contra, legibles en modo claro y oscuro;
- junto al chip de votos y de fecha, el número de votos a favor con el icono de pulgar arriba y el de votos en contra con el icono de pulgar abajo;
- una etiqueta accesible «Has votado a favor» o «Has votado en contra», para no depender solo del color.

Las tarjetas de temas no votados SHALL mantener el fondo neutro y SHALL NOT mostrar el desglose a favor/en contra. La API de listados (`GET /api/topics` y `GET /api/users/:id/topics`) SHALL incluir en cada tema `myVote` (`UP`, `DOWN` o `null`) y SHALL incluir los votos a favor y en contra solo cuando `myVote` no sea `null` (supuesto S-03). Tras votar un tema, las listas SHALL mostrar su tarjeta marcada sin necesidad de recargar la aplicación. Origen: HU-18 (CA-18.1–CA-18.4), HU-06, supuesto S-03.

#### Scenario: Tema votado a favor
- **WHEN** el usuario ha votado a favor un tema con 8 votos a favor y 4 en contra y abre la pantalla de temas
- **THEN** la tarjeta de ese tema tiene fondo verde suave y muestra «12 votos», la fecha, «8» con pulgar arriba y «4» con pulgar abajo

#### Scenario: Tema votado en contra
- **WHEN** el usuario ha votado en contra un tema
- **THEN** su tarjeta tiene fondo rojo suave y muestra el desglose de votos a favor y en contra

#### Scenario: Tema no votado
- **WHEN** la lista incluye un tema que el usuario no ha votado
- **THEN** su tarjeta tiene fondo neutro, muestra solo el total de votos y la fecha, y la respuesta de la API para ese tema tiene `myVote: null` y no incluye votos a favor ni en contra

#### Scenario: Voto propio accesible
- **WHEN** un lector de pantalla recorre la tarjeta de un tema votado en contra
- **THEN** anuncia «Has votado en contra» además del título y los votos

#### Scenario: Volver a la lista tras votar
- **WHEN** el usuario abre un tema desde la lista, lo vota a favor y vuelve atrás
- **THEN** la tarjeta de ese tema aparece con fondo verde suave y el desglose de votos actualizado

#### Scenario: Temas del perfil de una persona
- **WHEN** el usuario abre el perfil de una persona con un tema que ya ha votado
- **THEN** la tarjeta de ese tema aparece marcada igual que en la pantalla de temas
