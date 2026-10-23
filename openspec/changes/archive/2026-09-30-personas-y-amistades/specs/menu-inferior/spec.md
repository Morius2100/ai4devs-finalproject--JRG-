## ADDED Requirements

### Requirement: Menú inferior con Temas y Personas

El sistema SHALL mostrar, en las pantallas con sesión iniciada que usan el layout principal, un menú inferior fijo con dos pestañas: **Temas**, que lleva a la pantalla principal (`/`), y **Personas**, que lleva a `/personas`. Cada pestaña SHALL mostrar un icono y su texto. Tras iniciar sesión, la pantalla que se muestra por defecto SHALL ser Temas. Origen: HU-13 (CA-13.1).

#### Scenario: Pantalla por defecto tras iniciar sesión

- **WHEN** un usuario inicia sesión correctamente
- **THEN** el sistema muestra la pantalla de temas con el menú inferior y la pestaña "Temas" marcada como activa

#### Scenario: Cambiar a Personas

- **WHEN** el usuario pulsa la pestaña "Personas" del menú inferior
- **THEN** el sistema navega a `/personas` y marca "Personas" como pestaña activa

#### Scenario: Volver a Temas

- **WHEN** el usuario está en `/personas` y pulsa la pestaña "Temas"
- **THEN** el sistema navega a la pantalla principal de temas

### Requirement: Pestaña activa según la sección

El sistema SHALL marcar como activa la pestaña "Personas" en `/personas` y en cualquier perfil (`/personas/[id]`), y la pestaña "Temas" en `/` y en `/temas/nuevo`. La pestaña activa SHALL exponerse a tecnologías de asistencia con `aria-current="page"`. Origen: HU-13 (CA-13.1).

#### Scenario: Perfil dentro de Personas

- **WHEN** el usuario abre el perfil de otra persona
- **THEN** la pestaña "Personas" aparece activa y tiene `aria-current="page"`

#### Scenario: Crear tema dentro de Temas

- **WHEN** el usuario abre `/temas/nuevo`
- **THEN** la pestaña "Temas" aparece activa

### Requirement: Aspecto del menú inferior

El menú inferior SHALL usar como fondo el amarillo de marca y mostrar la pestaña activa dentro de una píldora blanca redondeada con el texto en verde oscuro de marca; la pestaña inactiva SHALL mostrarse sin fondo, con el mismo color de texto y sin negrita, sin reducir su opacidad para no perder contraste. Cada pestaña SHALL tener un área táctil mínima de 44 × 44 px y SHALL respetar el margen inferior seguro del dispositivo. El contenido de la pantalla SHALL NOT quedar oculto bajo el menú. Origen: HU-13 (CA-13.1), requisito "Accesibilidad y uso táctil" de `identidad-visual`.

#### Scenario: Pestaña activa destacada

- **WHEN** el usuario está en la pantalla de temas
- **THEN** el menú inferior tiene fondo amarillo de marca y la pestaña "Temas" se muestra sobre una píldora blanca

#### Scenario: Último elemento visible

- **WHEN** el usuario hace scroll hasta el final de una lista de temas o de personas
- **THEN** la última tarjeta se ve completa por encima del menú inferior

#### Scenario: Contraste en modo oscuro

- **WHEN** el dispositivo prefiere el modo oscuro
- **THEN** el texto de ambas pestañas mantiene un contraste de al menos 4.5:1 con su fondo
