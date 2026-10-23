## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Protección de pantallas y API

El sistema SHALL exigir sesión iniciada para acceder a cualquier pantalla o endpoint de la aplicación, excepto inicio de sesión y registro. La API SHALL considerar iniciada la sesión cuando la petición lleve la cookie de sesión de la web o un token válido en la cabecera `Authorization: Bearer`. Origen: HU-00 (CA-00.5), HU-16 (CA-16.2).

#### Scenario: Visitante accede a una pantalla protegida

- **WHEN** un visitante sin sesión abre cualquier pantalla distinta de `/login` o `/registro`
- **THEN** el sistema lo redirige a `/login`

#### Scenario: Petición a la API sin sesión

- **WHEN** se realiza una petición sin sesión a un endpoint `/api/*` distinto de `/api/register` y `/api/auth/*`
- **THEN** el sistema responde `401` con el formato de error estándar

#### Scenario: Petición a la API con token Bearer

- **WHEN** se realiza una petición a `GET /api/topics` con un token válido obtenido de `POST /api/auth/token`
- **THEN** el sistema responde como si el usuario del token tuviera la sesión iniciada

#### Scenario: Token inválido o caducado

- **WHEN** se realiza una petición a un endpoint protegido con un token manipulado o caducado
- **THEN** el sistema responde `401` con el formato de error estándar
