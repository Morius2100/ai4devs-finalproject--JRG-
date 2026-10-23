## Purpose

Identificación mínima de usuarios (registro, inicio de sesión, cierre de sesión) y protección de todas las pantallas y endpoints de Opina para quien no tiene sesión iniciada. Es la funcionalidad habilitante de la que dependen el resto de capacidades (voto único, atribución de opiniones, temas privados). Origen: HU-00, supuesto S-01 de `docs/01-producto.md`.

## Requirements

### Requirement: Registro de usuario

El sistema SHALL permitir a un visitante crear una cuenta con nombre de usuario (3–30 caracteres `[a-z0-9_]`, único), email (válido, único, normalizado a minúsculas) y contraseña (mínimo 8 caracteres), dejándolo con la sesión iniciada. Origen: HU-00 (CA-00.1, CA-00.2).

#### Scenario: Registro correcto

- **WHEN** un visitante envía nombre de usuario, email y contraseña válidos y no registrados
- **THEN** el sistema crea la cuenta, almacena la contraseña como hash, inicia la sesión y muestra la pantalla principal

#### Scenario: Nombre de usuario o email ya registrados

- **WHEN** un visitante intenta registrarse con un nombre de usuario o un email que ya existen
- **THEN** el sistema rechaza el registro con un error de conflicto y no crea ninguna cuenta

#### Scenario: Datos de registro inválidos

- **WHEN** un visitante envía un nombre de usuario, email o contraseña que no cumplen las reglas
- **THEN** el sistema rechaza el registro indicando qué campos son inválidos

#### Scenario: La contraseña nunca se expone

- **WHEN** cualquier endpoint devuelve datos de un usuario
- **THEN** la respuesta no contiene la contraseña ni su hash

### Requirement: Inicio de sesión

El sistema SHALL permitir iniciar sesión con email y contraseña, mostrando un error genérico si las credenciales no son correctas. Origen: HU-00 (CA-00.3, CA-00.4).

#### Scenario: Credenciales correctas

- **WHEN** un usuario registrado introduce su email y contraseña correctos
- **THEN** el sistema inicia la sesión y muestra la pantalla principal

#### Scenario: Credenciales incorrectas

- **WHEN** alguien introduce un email inexistente o una contraseña incorrecta
- **THEN** el sistema muestra el mensaje "Credenciales incorrectas" sin indicar cuál de los dos datos falla

### Requirement: Protección de pantallas y API

El sistema SHALL exigir sesión iniciada para acceder a cualquier pantalla o endpoint de la aplicación, excepto inicio de sesión y registro, la comprobación de estado de la API (`/api/health`) y las imágenes subidas (`/api/media/*`, cuyas claves son aleatorias, como lo eran las URLs del bucket público). La API SHALL considerar iniciada la sesión cuando la petición lleve la cookie de sesión de la web o un token válido en la cabecera `Authorization: Bearer`. Origen: HU-00 (CA-00.5), HU-16 (CA-16.2), HU-22 (CA-22.2, CA-22.4).

#### Scenario: Visitante accede a una pantalla protegida

- **WHEN** un visitante sin sesión abre cualquier pantalla distinta de `/login` o `/registro`
- **THEN** el sistema lo redirige a `/login`

#### Scenario: Petición a la API sin sesión

- **WHEN** se realiza una petición sin sesión a un endpoint `/api/*` distinto de `/api/register`, `/api/auth/*`, `/api/health` y `/api/media/*`
- **THEN** el sistema responde `401` con el formato de error estándar

#### Scenario: Rutas públicas de la API

- **WHEN** se realiza sin sesión una petición a `GET /api/health` o a `GET /api/media/avatars/<id>.png` de una imagen existente
- **THEN** el sistema responde `200`

#### Scenario: Petición a la API con token Bearer

- **WHEN** se realiza una petición a `GET /api/topics` con un token válido obtenido de `POST /api/auth/token`
- **THEN** el sistema responde como si el usuario del token tuviera la sesión iniciada

#### Scenario: Token inválido o caducado

- **WHEN** se realiza una petición a un endpoint protegido con un token manipulado o caducado
- **THEN** el sistema responde `401` con el formato de error estándar

### Requirement: Cierre de sesión desde el menú principal

El sistema SHALL ofrecer en el menú principal una opción para cerrar la sesión. Origen: HU-00 (CA-00.6).

#### Scenario: Cerrar sesión

- **WHEN** un usuario con sesión pulsa "Cerrar sesión" en el menú principal
- **THEN** el sistema finaliza la sesión y muestra la pantalla de inicio de sesión

### Requirement: Sesión por token en la app

El sistema SHALL ofrecer `POST /api/auth/token`, que con un email y una contraseña correctos devuelve un token de sesión con el identificador y el nombre del usuario, válido durante 30 días. Con credenciales incorrectas SHALL responder `401` con el mensaje "Credenciales incorrectas", sin indicar cuál de los dos datos falla. La app SHALL guardar el token en el almacenamiento del dispositivo, enviarlo como `Authorization: Bearer <token>` en cada petición a la API y conservar la sesión al cerrar y reabrir la app. Tras un registro correcto, la app SHALL obtener el token del mismo modo y dejar la sesión iniciada. Origen: HU-16 (CA-16.2), HU-00 (CA-00.1, CA-00.3, CA-00.4).

#### Scenario: Inicio de sesión en la app
- **WHEN** un usuario registrado introduce su email y contraseña correctos en la app
- **THEN** la app obtiene un token, lo guarda y muestra la pantalla principal

#### Scenario: Credenciales incorrectas en el endpoint de token
- **WHEN** se envía a `POST /api/auth/token` una contraseña incorrecta
- **THEN** el sistema responde `401` con el mensaje "Credenciales incorrectas" y no devuelve token

#### Scenario: Sesión conservada
- **WHEN** el usuario con sesión iniciada cierra la app por completo y la vuelve a abrir
- **THEN** la app muestra directamente la pantalla principal

#### Scenario: Cerrar sesión en la app
- **WHEN** el usuario pulsa "Cerrar sesión" en el menú principal de la app
- **THEN** la app borra el token guardado y muestra la pantalla de inicio de sesión
