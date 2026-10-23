## ADDED Requirements

### Requirement: Interfaz empaquetada en la app Android

El sistema SHALL ofrecer una app Android (APK) que contenga todas las pantallas de Opina como archivos locales, sin cargar la interfaz desde un servidor remoto. La app SHALL obtener los datos de la API de Opina en una URL configurada al compilar. Las pantallas, las funciones y las reglas de negocio SHALL ser las mismas que en la web. Origen: HU-16 (CA-16.1).

#### Scenario: Arranque sin el ordenador de desarrollo
- **WHEN** el usuario abre la app instalada en un móvil sin cable, con Internet y con la API desplegada en la URL configurada
- **THEN** la app muestra la pantalla de inicio de sesión o la pantalla principal, según tenga o no la sesión iniciada

#### Scenario: Misma funcionalidad que la web
- **WHEN** el usuario vota un tema desde la app
- **THEN** el voto queda registrado igual que desde la web y los resultados se muestran con los mismos bloques

### Requirement: Protección de pantallas en la app

La app SHALL mostrar la pantalla de inicio de sesión a quien no tenga sesión al abrir cualquier pantalla distinta de inicio de sesión y registro. La app SHALL volver a la pantalla de inicio de sesión y descartar la sesión guardada cuando la API responda `401`. Origen: HU-16 (CA-16.2), HU-00 (CA-00.5).

#### Scenario: Primera apertura
- **WHEN** el usuario abre la app por primera vez
- **THEN** la app muestra la pantalla de inicio de sesión

#### Scenario: Sesión caducada
- **WHEN** el usuario tiene una sesión guardada que la API rechaza con `401`
- **THEN** la app borra la sesión guardada y muestra la pantalla de inicio de sesión

### Requirement: Botón atrás del sistema

La app SHALL responder al botón «atrás» de Android volviendo a la pantalla anterior. En la pantalla principal o en la de inicio de sesión, sin pantalla anterior, SHALL cerrar la app. Origen: HU-16 (CA-16.3).

#### Scenario: Atrás desde un tema
- **WHEN** el usuario abre un tema desde la pantalla principal y pulsa «atrás»
- **THEN** la app vuelve a la pantalla principal

#### Scenario: Atrás en la pantalla principal
- **WHEN** el usuario pulsa «atrás» en la pantalla principal sin pantalla anterior
- **THEN** la app se cierra

### Requirement: Arranque y barra de estado con la marca

La app SHALL mostrar al arrancar una pantalla con el color verde de marca (`#035949`) y el logotipo de Opina, que desaparece cuando la interfaz está lista. La barra de estado de Android SHALL usar el mismo verde con iconos claros. La app SHALL usar el logotipo de Opina como icono en el lanzador. Origen: HU-16 (CA-16.4).

#### Scenario: Apertura de la app
- **WHEN** el usuario pulsa el icono de Opina en el lanzador
- **THEN** ve la pantalla de arranque verde con el logotipo y, a continuación, la primera pantalla de la app con la barra de estado verde

### Requirement: Pantalla sin conexión

La app SHALL mostrar una pantalla «Sin conexión» con un botón «Reintentar» cuando el dispositivo no tenga conexión o la API no responda. Al recuperarse la conexión o al pulsar «Reintentar» con conexión, la app SHALL volver a cargar la pantalla en la que estaba. Origen: HU-16 (CA-16.5).

#### Scenario: Abrir la app en modo avión
- **WHEN** el usuario abre la app con el modo avión activado
- **THEN** la app muestra «Sin conexión» y el botón «Reintentar»

#### Scenario: Recuperar la conexión
- **WHEN** la app muestra «Sin conexión» y el usuario desactiva el modo avión
- **THEN** la app vuelve a cargar la pantalla en la que estaba

### Requirement: Acceso a la API solo desde orígenes permitidos

La API SHALL responder a las peticiones entre orígenes (CORS), incluida la petición previa `OPTIONS`, solo cuando el origen sea el de la app Capacitor (`https://localhost`, `http://localhost` o `capacitor://localhost`). SHALL permitir la cabecera `Authorization` y SHALL NOT permitir credenciales de cookie entre orígenes. Origen: HU-16 (CA-16.1).

#### Scenario: Petición previa desde la app
- **WHEN** la app envía `OPTIONS /api/topics` con origen `https://localhost`
- **THEN** la API responde `204` con `Access-Control-Allow-Origin: https://localhost` y permite la cabecera `Authorization`

#### Scenario: Origen no permitido
- **WHEN** una web con origen `https://ejemplo.com` envía `OPTIONS /api/topics`
- **THEN** la respuesta no incluye `Access-Control-Allow-Origin`
