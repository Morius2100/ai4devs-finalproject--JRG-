## ADDED Requirements

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

El sistema SHALL exigir sesión iniciada para acceder a cualquier pantalla o endpoint de la aplicación, excepto inicio de sesión y registro. Origen: HU-00 (CA-00.5).

#### Scenario: Visitante accede a una pantalla protegida

- **WHEN** un visitante sin sesión abre cualquier pantalla distinta de `/login` o `/registro`
- **THEN** el sistema lo redirige a `/login`

#### Scenario: Petición a la API sin sesión

- **WHEN** se realiza una petición sin sesión a un endpoint `/api/*` distinto de `/api/register` y `/api/auth/*`
- **THEN** el sistema responde `401` con el formato de error estándar

### Requirement: Cierre de sesión desde el menú principal

El sistema SHALL ofrecer en el menú principal una opción para cerrar la sesión. Origen: HU-00 (CA-00.6).

#### Scenario: Cerrar sesión

- **WHEN** un usuario con sesión pulsa "Cerrar sesión" en el menú principal
- **THEN** el sistema finaliza la sesión y muestra la pantalla de inicio de sesión
