## MODIFIED Requirements

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
