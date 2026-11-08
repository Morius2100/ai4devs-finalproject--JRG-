## ADDED Requirements

### Requirement: La aplicación tiene un Dockerfile
El repositorio SHALL incluir un `Dockerfile` multietapa que construya la aplicación con la salida `standalone` de Next.js, la ejecute con un usuario sin privilegios y declare un `HEALTHCHECK` sobre `/api/health`. La imagen MUST NOT contener secretos: el build recibe valores de relleno y el contenedor recibe los reales al arrancar. Origen: Revisión 1 de LIDR, tarea T10.

#### Scenario: Construir la imagen
- **WHEN** se ejecuta `docker build -t opina .`
- **THEN** la imagen se construye sin variables de entorno reales

#### Scenario: Arranque
- **WHEN** se arranca el contenedor con la base de datos accesible
- **THEN** aplica las migraciones y `/api/health` responde `200`

#### Scenario: Usuario sin privilegios
- **WHEN** se inspecciona el proceso del contenedor
- **THEN** no se ejecuta como `root`

### Requirement: La salida standalone no altera Vercel ni la APK
`next.config.ts` SHALL activar `output: "standalone"` solo cuando `NEXT_OUTPUT=standalone`. Sin esa variable, el build de Vercel y el export estático de la APK MUST ser idénticos a los de ahora. Origen: Revisión 1 de LIDR, tarea T10.

#### Scenario: Build de Vercel
- **WHEN** se ejecuta `npm run build` sin `NEXT_OUTPUT`
- **THEN** no se genera `.next/standalone`

#### Scenario: Export móvil
- **WHEN** se ejecuta `npm run build:mobile`
- **THEN** el resultado en `out-mobile` es el mismo que antes del cambio

### Requirement: El entorno completo se levanta con Docker Compose
`docker-compose.yml` SHALL incluir un servicio `app` en un _profile_ propio, dependiente de PostgreSQL y MinIO sanos, que ejecute la aplicación en el contenedor. `docker compose up -d` sin el _profile_ SHALL seguir levantando solo PostgreSQL y MinIO. Origen: Revisión 1 de LIDR, tarea T10.

#### Scenario: Entorno completo
- **WHEN** se ejecuta `docker compose --profile app up -d --build`
- **THEN** la aplicación responde en `http://localhost:3000` y permite registrarse e iniciar sesión

#### Scenario: Compose sin el profile
- **WHEN** se ejecuta `docker compose up -d`
- **THEN** solo arrancan PostgreSQL y MinIO

### Requirement: El CI comprueba que la imagen se construye
El workflow SHALL incluir un job `docker` que construya la imagen sin publicarla, para detectar un `Dockerfile` roto. Origen: Revisión 1 de LIDR, tarea T10.

#### Scenario: Dockerfile roto
- **WHEN** un cambio rompe el `Dockerfile`
- **THEN** el job `docker` falla en la pull request
