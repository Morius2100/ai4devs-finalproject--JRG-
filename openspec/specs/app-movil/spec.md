## Purpose

App Android de Opina con la interfaz empaquetada (Capacitor): funciona sin el ordenador de desarrollo contra la API desplegada y se integra con el sistema (botón atrás, arranque con la marca, pantalla sin conexión). Origen: HU-16 (cambio `app-movil-empaquetada`).

## Requirements

### Requirement: Interfaz empaquetada en la app Android

El sistema SHALL ofrecer una app Android (APK) que contenga todas las pantallas de Opina como archivos locales, sin cargar la interfaz desde un servidor remoto. La app SHALL obtener los datos de la API de Opina de una URL:

- en el build de producción, la URL fijada al compilar;
- en el build de desarrollo, la del servidor que el usuario haya configurado en la app o, si no ha configurado ninguno, la fijada al compilar.

Las pantallas, las funciones y las reglas de negocio SHALL ser las mismas que en la web. Origen: HU-16 (CA-16.1), HU-22 (CA-22.1).

#### Scenario: Arranque sin el ordenador de desarrollo
- **WHEN** el usuario abre la app instalada en un móvil sin cable, con Internet y con la API desplegada en la URL configurada
- **THEN** la app muestra la pantalla de inicio de sesión o la pantalla principal, según tenga o no la sesión iniciada

#### Scenario: Misma funcionalidad que la web
- **WHEN** el usuario vota un tema desde la app
- **THEN** el voto queda registrado igual que desde la web y los resultados se muestran con los mismos bloques

#### Scenario: Build de desarrollo sin cable, en la misma red
- **WHEN** el APK de desarrollo tiene configurado el servidor `http://192.168.5.101:3000`, el móvil está en la misma red que el PC y no está conectado por USB
- **THEN** la app inicia sesión, lista los temas y permite votar contra ese servidor

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

En el build de desarrollo, la pantalla «Sin conexión» SHALL mostrar además el servidor en uso y la opción «Cambiar servidor». Esa opción abre, en la misma pantalla y con o sin sesión iniciada, el formulario de dirección del requisito «Servidor configurable en el build de desarrollo», con las mismas reglas: validación de la dirección, comprobación de `GET <dirección>/api/health` antes de guardar, error «No se puede conectar con ese servidor», «Restablecer» y «Volver». Al guardar un servidor distinto que responde, la app SHALL quitar «Sin conexión» y aplicar el requisito «Cambio de servidor con sesión iniciada»: cerrar la sesión si la había, borrar los datos en caché y mostrar la pantalla de inicio de sesión del nuevo servidor. Mientras el formulario esté abierto, la app SHALL NOT volver a probar la API por su cuenta. El build de producción SHALL NOT mostrar el servidor ni «Cambiar servidor» en esta pantalla. Origen: HU-16 (CA-16.5), HU-22 (CA-22.5).

#### Scenario: Abrir la app en modo avión
- **WHEN** el usuario abre la app con el modo avión activado
- **THEN** la app muestra «Sin conexión» y el botón «Reintentar»

#### Scenario: Recuperar la conexión
- **WHEN** la app muestra «Sin conexión» y el usuario desactiva el modo avión
- **THEN** la app vuelve a cargar la pantalla en la que estaba

#### Scenario: Cambiar de servidor desde «Sin conexión» con sesión iniciada
- **WHEN** el APK de desarrollo, con sesión iniciada, muestra «Sin conexión» porque `http://localhost:3000` no responde, y el usuario pulsa «Cambiar servidor», escribe `http://192.168.5.101:3000` con el servidor en marcha y lo guarda
- **THEN** la app comprueba `/api/health`, guarda la dirección, quita «Sin conexión», cierra la sesión y muestra la pantalla de inicio de sesión con `192.168.5.101:3000` como servidor en uso

#### Scenario: Cambiar de servidor desde «Sin conexión» sin sesión
- **WHEN** el APK de desarrollo sin sesión muestra «Sin conexión» y el usuario guarda desde «Cambiar servidor» una dirección distinta que responde
- **THEN** la app quita «Sin conexión» y muestra la pantalla de inicio de sesión del nuevo servidor

#### Scenario: El servidor nuevo tampoco responde
- **WHEN** en «Sin conexión» el usuario escribe en «Cambiar servidor» `http://192.168.5.250:3000`, donde no hay ningún servidor, y lo guarda
- **THEN** la app muestra «No se puede conectar con ese servidor», sigue en «Sin conexión» con el formulario abierto y mantiene el servidor anterior

#### Scenario: Sin reintentos mientras se escribe
- **WHEN** en «Sin conexión» el usuario tiene abierto el formulario de «Cambiar servidor» y el servidor anterior vuelve a responder
- **THEN** la app no cierra el formulario ni la pantalla por su cuenta, y al pulsar «Volver» reanuda los reintentos automáticos

#### Scenario: Build de producción sin conexión
- **WHEN** el APK de producción muestra «Sin conexión»
- **THEN** la pantalla solo ofrece «Reintentar», sin servidor en uso ni «Cambiar servidor»

### Requirement: Acceso a la API solo desde orígenes permitidos

La API SHALL responder a las peticiones entre orígenes (CORS), incluida la petición previa `OPTIONS`, solo cuando el origen sea el de la app Capacitor (`https://localhost`, `http://localhost` o `capacitor://localhost`). SHALL permitir la cabecera `Authorization` y SHALL NOT permitir credenciales de cookie entre orígenes. Origen: HU-16 (CA-16.1).

#### Scenario: Petición previa desde la app
- **WHEN** la app envía `OPTIONS /api/topics` con origen `https://localhost`
- **THEN** la API responde `204` con `Access-Control-Allow-Origin: https://localhost` y permite la cabecera `Authorization`

#### Scenario: Origen no permitido
- **WHEN** una web con origen `https://ejemplo.com` envía `OPTIONS /api/topics`
- **THEN** la respuesta no incluye `Access-Control-Allow-Origin`

### Requirement: Servidor configurable en el build de desarrollo

En el build de desarrollo, la pantalla de inicio de sesión SHALL mostrar el servidor en uso y una opción «Cambiar servidor» que permita escribir una dirección `http://` o `https://` con host y, opcionalmente, puerto. Antes de guardarla, la app SHALL comprobar que `GET <dirección>/api/health` responde correctamente. Si no responde, SHALL mostrar «No se puede conectar con ese servidor» y SHALL NOT guardarla. La dirección guardada SHALL conservarse al cerrar y reabrir la app. «Restablecer» SHALL volver a la dirección fijada al compilar. El build de producción SHALL NOT mostrar ninguna de estas opciones y SHALL usar siempre la dirección fijada al compilar. Origen: HU-22 (CA-22.1, CA-22.2).

#### Scenario: Configurar el servidor del PC
- **WHEN** en la pantalla de inicio de sesión el usuario pulsa «Cambiar servidor», escribe `http://192.168.5.101:3000` y lo guarda con el servidor en marcha
- **THEN** la app comprueba `/api/health`, guarda la dirección y la muestra como servidor en uso

#### Scenario: Servidor que no responde
- **WHEN** el usuario escribe `http://192.168.5.250:3000`, donde no hay ningún servidor, y lo guarda
- **THEN** la app muestra «No se puede conectar con ese servidor» y sigue usando el servidor anterior

#### Scenario: Dirección mal escrita
- **WHEN** el usuario escribe `192.168.5.101 3000`
- **THEN** la app indica que la dirección no es válida sin hacer ninguna petición

#### Scenario: Servidor conservado
- **WHEN** el usuario configura un servidor, cierra la app por completo y la vuelve a abrir
- **THEN** la app sigue usando ese servidor

#### Scenario: Build de producción
- **WHEN** el usuario abre la pantalla de inicio de sesión del APK de producción
- **THEN** no se muestra el servidor ni la opción «Cambiar servidor»

### Requirement: Cambio de servidor con sesión iniciada

En el build de desarrollo, el menú principal SHALL ofrecer la opción «Servidor», que muestra el servidor en uso y permite cambiarlo con la misma comprobación. Cambiar de servidor SHALL cerrar la sesión, borrar los datos en caché y llevar a la pantalla de inicio de sesión, porque el token pertenece al servidor anterior. Origen: HU-22 (CA-22.3).

#### Scenario: Cambiar de servidor con sesión
- **WHEN** el usuario con sesión iniciada abre «Servidor» en el menú principal y guarda una dirección distinta que responde
- **THEN** la app cierra la sesión, olvida los datos del servidor anterior y muestra la pantalla de inicio de sesión del nuevo servidor

#### Scenario: Guardar el mismo servidor
- **WHEN** el usuario guarda la misma dirección que ya está en uso
- **THEN** la app no cierra la sesión

### Requirement: Imágenes servidas por la API

El sistema SHALL servir las imágenes subidas (fotos de perfil y de temas) en `GET /api/media/{clave}` desde el mismo servidor que la API, sin exigir sesión, con su tipo de contenido y cabeceras de caché de larga duración. La API SHALL devolver las imágenes subidas como rutas relativas (`/api/media/...`) y las imágenes externas (por ejemplo, las del seed) con su URL completa sin cambios. La app SHALL resolver las rutas relativas contra el servidor en uso, de modo que el móvil no necesite acceso directo al almacenamiento de imágenes. `GET /api/media` SHALL responder `404` ante una clave inexistente y SHALL NOT servir claves fuera de `avatars/` y `topics/`. Origen: HU-22 (CA-22.4).

#### Scenario: Foto de perfil desde el móvil en la red local
- **WHEN** el usuario sube una foto de perfil y otro móvil, conectado al mismo servidor por la red local, abre su perfil
- **THEN** la foto se carga desde `http://<servidor>/api/media/avatars/<id>.<ext>`

#### Scenario: Imagen externa
- **WHEN** la API devuelve un usuario del seed con foto de `https://picsum.photos/...`
- **THEN** la URL se devuelve sin cambios y la imagen se carga desde ese sitio

#### Scenario: Clave inexistente o fuera de las carpetas permitidas
- **WHEN** se pide `GET /api/media/avatars/no-existe.png` o `GET /api/media/../.env`
- **THEN** el sistema responde `404`

#### Scenario: Imágenes subidas antes de este cambio
- **WHEN** se aplica la migración y un tema tenía la imagen `http://localhost:9000/opina-images/topics/<id>.png`
- **THEN** el tema pasa a guardar la clave `topics/<id>.png` y la API la devuelve como `/api/media/topics/<id>.png`

### Requirement: HTTP sin cifrar solo en desarrollo

El APK de desarrollo (debug) SHALL permitir conexiones HTTP sin cifrar con el servidor configurado, para poder usar un servidor de la red local sin certificado. El APK de release SHALL NOT permitir HTTP sin cifrar. Origen: HU-22 (CA-22.1).

#### Scenario: Servidor HTTP en la red local
- **WHEN** el APK de desarrollo usa `http://192.168.5.101:3000`
- **THEN** las peticiones a la API no se bloquean por ser HTTP

#### Scenario: Release
- **WHEN** se compila el APK de release
- **THEN** su configuración de red no permite tráfico HTTP sin cifrar
