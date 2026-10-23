## MODIFIED Requirements

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

## ADDED Requirements

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
