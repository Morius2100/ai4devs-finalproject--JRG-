## ADDED Requirements

### Requirement: Limitación de intentos

El sistema SHALL limitar el número de peticiones por ventana de tiempo en el inicio de sesión web, `POST /api/auth/token`, `POST /api/register` y el envío de solicitudes de amistad. Al superar el límite SHALL responder `429` con la cabecera `Retry-After` y SHALL NOT procesar la petición. Origen: HU-00 (identificación de usuarios), HU-15, hallazgo S-03.

#### Scenario: Fuerza bruta de contraseña

- **WHEN** se envían más de 10 intentos de inicio de sesión en un minuto desde la misma IP para el mismo email (los intentos se cuentan, aciertos o no)
- **THEN** el siguiente intento recibe `429` con `Retry-After`, aunque la contraseña fuera correcta

#### Scenario: Solicitudes masivas

- **WHEN** un usuario envía más de 30 solicitudes de amistad en una hora
- **THEN** las siguientes reciben `429` y no se crean solicitudes

#### Scenario: Uso normal

- **WHEN** un usuario inicia sesión una vez con credenciales correctas
- **THEN** la petición se procesa sin ser limitada

### Requirement: Inicio de sesión sin pistas sobre las cuentas

El sistema SHALL responder con el mismo mensaje, el mismo código y un tiempo de respuesta comparable cuando el email no existe y cuando la contraseña es incorrecta. SHALL comparar siempre la contraseña con un hash, real o ficticio. Origen: HU-00, hallazgo S-04.

#### Scenario: Email inexistente

- **WHEN** se inicia sesión con un email que no está registrado
- **THEN** la respuesta es `401` con «Credenciales incorrectas» y el sistema ha ejecutado una comparación de bcrypt

### Requirement: Longitud acotada de la contraseña

El sistema SHALL rechazar con `400` las contraseñas de más de 72 caracteres, que es el límite que bcrypt procesa realmente, y SHALL seguir exigiendo un mínimo de 8. Origen: HU-00, hallazgo S-09.

#### Scenario: Contraseña demasiado larga

- **WHEN** se registra un usuario con una contraseña de 200 caracteres
- **THEN** el sistema responde `400` con un error de validación en `password` y no crea el usuario

### Requirement: Imágenes de temas privados protegidas

El sistema SHALL servir la imagen de un tema privado únicamente a quien pueda acceder a ese tema según `VisibilityPolicy`, mediante una URL firmada de corta duración generada por el servidor. Una URL sin firma, con firma inválida o caducada SHALL responder `404`. Las imágenes de temas públicos y las fotos de perfil SHALL seguir siendo accesibles sin firma. Origen: HU-11, HU-10, hallazgo S-05.

#### Scenario: Amigo con acceso

- **WHEN** "bruno", amigo de "ana", abre un tema privado de "ana" con imagen
- **THEN** la respuesta incluye una URL firmada que carga la imagen

#### Scenario: URL copiada y caducada

- **WHEN** se abre la URL firmada de esa imagen después de que haya caducado
- **THEN** el sistema responde `404`

#### Scenario: Sin firma

- **WHEN** alguien sin sesión pide `/api/media/topics/{clave}` de un tema privado sin firma
- **THEN** el sistema responde `404`

### Requirement: Credenciales de prueba fuera de producción

El proceso de despliegue SHALL NOT cargar el seed de desarrollo (usuarios `ana`, `bruno`, `carla`, `dani` con contraseña conocida) en un entorno de producción, salvo confirmación explícita con la variable `ALLOW_PRODUCTION_SEED=1`. El seed SHALL tomar la contraseña de una variable de entorno cuando se ejecute fuera de local. Origen: HU-00, hallazgo S-02.

#### Scenario: Seed en producción sin confirmación

- **WHEN** el build se ejecuta con `VERCEL_ENV=production` y `RUN_SEED=1` y sin `ALLOW_PRODUCTION_SEED`
- **THEN** el build termina con error y un mensaje que explica por qué

#### Scenario: Seed en local

- **WHEN** se ejecuta `npx prisma db seed` en local
- **THEN** se crean los usuarios de prueba como hasta ahora

### Requirement: Cabeceras de seguridad HTTP

El sistema SHALL añadir a las respuestas de la web las cabeceras `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` restrictiva y `frame-ancestors 'none'`. Origen: HU-00, hallazgo S-06.

#### Scenario: Respuesta de una página

- **WHEN** se pide `/login` y se inspeccionan las cabeceras
- **THEN** aparecen todas las cabeceras indicadas

#### Scenario: La aplicación sigue funcionando

- **WHEN** se ejecuta el flujo completo (registro, voto con justificación, creación de tema con imagen) con las cabeceras activas
- **THEN** no hay violaciones de CSP en la consola del navegador
