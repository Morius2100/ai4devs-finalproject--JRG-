## MODIFIED Requirements

### Requirement: Acceso al perfil desde la lista

El sistema SHALL abrir el perfil de una persona (`/persona?id=<id>`) al pulsar su elemento en la lista. Cada elemento SHALL tener un área táctil mínima de 44 px de alto. En la web, la dirección anterior `/personas/<id>` SHALL redirigir de forma permanente a `/persona?id=<id>`. Origen: HU-14 (CA-14.1), HU-16 (CA-16.1).

#### Scenario: Abrir un perfil

- **WHEN** el usuario pulsa sobre "bruno" en la lista de personas
- **THEN** el sistema muestra el perfil de "bruno"

#### Scenario: Enlace antiguo en la web

- **WHEN** el usuario abre en el navegador `/personas/{id-de-bruno}`
- **THEN** el sistema lo redirige a `/persona?id={id-de-bruno}` y muestra el perfil de "bruno"

### Requirement: Perfil inexistente

El sistema SHALL mostrar una pantalla «Persona no encontrada», con un enlace de vuelta a Personas, cuando el identificador del perfil falte, no tenga un formato válido o no corresponda a ningún usuario. La API (`GET /api/users/{id}`) SHALL responder `404` en esos casos. Origen: HU-14 (CA-14.5).

#### Scenario: Identificador desconocido

- **WHEN** el usuario abre `/persona?id=00000000-0000-0000-0000-000000000000` y no existe ese usuario
- **THEN** el sistema muestra «Persona no encontrada» y un enlace a `/personas`

#### Scenario: Sin identificador

- **WHEN** el usuario abre `/persona` sin el parámetro `id`
- **THEN** el sistema muestra «Persona no encontrada» y un enlace a `/personas`
