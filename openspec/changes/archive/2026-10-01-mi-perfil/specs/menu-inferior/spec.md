## RENAMED Requirements

- FROM: `### Requirement: Menú inferior con Temas y Personas`
- TO: `### Requirement: Menú inferior con Temas, Personas y Perfil`

## MODIFIED Requirements

### Requirement: Menú inferior con Temas, Personas y Perfil

El sistema SHALL mostrar, en las pantallas con sesión iniciada que usan el layout principal, un menú inferior fijo con tres pestañas: **Temas**, que lleva a la pantalla principal (`/`); **Personas**, que lleva a `/personas`; y **Perfil**, que lleva a `/perfil`. Cada pestaña SHALL mostrar un icono y su texto. Tras iniciar sesión, la pantalla que se muestra por defecto SHALL ser Temas. Origen: HU-13 (CA-13.1), HU-21 (CA-21.1).

#### Scenario: Pantalla por defecto tras iniciar sesión

- **WHEN** un usuario inicia sesión correctamente
- **THEN** el sistema muestra la pantalla de temas con el menú inferior y la pestaña "Temas" marcada como activa

#### Scenario: Cambiar a Personas

- **WHEN** el usuario pulsa la pestaña "Personas" del menú inferior
- **THEN** el sistema navega a `/personas` y marca "Personas" como pestaña activa

#### Scenario: Cambiar a Perfil

- **WHEN** el usuario pulsa la pestaña "Perfil" del menú inferior
- **THEN** el sistema navega a `/perfil` y marca "Perfil" como pestaña activa

#### Scenario: Volver a Temas

- **WHEN** el usuario está en `/personas` o en `/perfil` y pulsa la pestaña "Temas"
- **THEN** el sistema navega a la pantalla principal de temas

### Requirement: Pestaña activa según la sección

El sistema SHALL marcar como activa:

- la pestaña "Personas" en `/personas` y en cualquier perfil de persona (`/persona`);
- la pestaña "Temas" en `/` y en `/temas/nuevo`;
- la pestaña "Perfil" en `/perfil`, `/perfil/amigos` y `/perfil/editar`.

La pestaña activa SHALL exponerse a tecnologías de asistencia con `aria-current="page"`. Origen: HU-13 (CA-13.1), HU-21 (CA-21.1).

#### Scenario: Perfil dentro de Personas

- **WHEN** el usuario abre el perfil de otra persona
- **THEN** la pestaña "Personas" aparece activa y tiene `aria-current="page"`

#### Scenario: Crear tema dentro de Temas

- **WHEN** el usuario abre `/temas/nuevo`
- **THEN** la pestaña "Temas" aparece activa

#### Scenario: Pantallas de mi perfil

- **WHEN** el usuario abre `/perfil/amigos` o `/perfil/editar`
- **THEN** la pestaña "Perfil" aparece activa y tiene `aria-current="page"`

### Requirement: Aspecto del menú inferior

El menú inferior SHALL usar como fondo el amarillo de marca y mostrar la pestaña activa dentro de una píldora blanca redondeada con el texto en verde oscuro de marca. Las pestañas inactivas SHALL mostrarse sin fondo, con el mismo color de texto y sin negrita, sin reducir su opacidad para no perder contraste. Las tres pestañas SHALL repartirse el ancho a partes iguales. Cada pestaña SHALL tener un área táctil mínima de 44 × 44 px y SHALL respetar el margen inferior seguro del dispositivo. El contenido de la pantalla SHALL NOT quedar oculto bajo el menú. Origen: HU-13 (CA-13.1), requisito "Accesibilidad y uso táctil" de `identidad-visual`.

#### Scenario: Pestaña activa destacada

- **WHEN** el usuario está en la pantalla de temas
- **THEN** el menú inferior tiene fondo amarillo de marca y la pestaña "Temas" se muestra sobre una píldora blanca

#### Scenario: Tres pestañas en un móvil estrecho

- **WHEN** el usuario abre la pantalla de temas en un móvil de 360 px de ancho
- **THEN** las tres pestañas se ven completas, con su icono y su texto, y cada una mide al menos 44 × 44 px

#### Scenario: Último elemento visible

- **WHEN** el usuario hace scroll hasta el final de una lista de temas, de personas o de amigos
- **THEN** la última tarjeta se ve completa por encima del menú inferior

#### Scenario: Contraste en modo oscuro

- **WHEN** el dispositivo prefiere el modo oscuro
- **THEN** el texto de todas las pestañas mantiene un contraste de al menos 4.5:1 con su fondo
