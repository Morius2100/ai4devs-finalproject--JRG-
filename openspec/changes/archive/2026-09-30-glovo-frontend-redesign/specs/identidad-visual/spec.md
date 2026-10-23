## ADDED Requirements

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

El sistema SHALL mostrar cada tema de la lista de tendencias o de búsqueda como una tarjeta pulsable que incluye el título, una miniatura de la imagen si el tema la tiene y el número total de votos. Un tema sin imagen SHALL mostrarse sin miniatura ni hueco vacío equivalente a una imagen rota. El orden y el contenido de la lista SHALL NOT cambiar. Origen: HU-01, HU-02.

#### Scenario: Tema con imagen en la lista
- **WHEN** la lista de tendencias incluye un tema con imagen y 12 votos
- **THEN** su tarjeta muestra la miniatura, el título y el indicador "12 votos", y al pulsarla se abre `/temas/[id]`

#### Scenario: Tema sin imagen en la lista
- **WHEN** la lista incluye un tema sin imagen
- **THEN** su tarjeta muestra un marcador visual neutro con la inicial del título en lugar de la miniatura

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
