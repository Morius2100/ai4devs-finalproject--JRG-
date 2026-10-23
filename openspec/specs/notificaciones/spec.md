## Purpose

Aviso a los amigos del creador cuando este crea un tema privado, y una pantalla para consultar esas notificaciones y acceder al tema desde ellas. Origen: HU-12 de la definición del producto.

## Requirements

### Requirement: Notificación a los amigos al crear un tema privado

El sistema SHALL crear, al crearse un tema privado, una notificación para cada usuario de la lista de amigos del creador indicando que un amigo ha creado una nueva propuesta, de forma atómica con la creación del tema. El sistema SHALL NOT notificar a usuarios que no son amigos del creador ni generar notificaciones al crear temas públicos. Origen: HU-12 (CA-12.1, CA-12.5, CA-12.6).

#### Scenario: Crear un tema privado

- **WHEN** "ana", con amigos "bruno" y "carla", crea un tema privado
- **THEN** "bruno" y "carla" reciben cada uno una notificación y "dani" no recibe ninguna

#### Scenario: Crear un tema público

- **WHEN** "ana" crea un tema público
- **THEN** no se genera ninguna notificación

#### Scenario: Creador sin amigos

- **WHEN** un usuario sin amigos crea un tema privado
- **THEN** el tema se crea y no se genera ninguna notificación

### Requirement: Pantalla de notificaciones

El sistema SHALL ofrecer en el menú principal acceso a una pantalla de notificaciones que las muestra de más reciente a más antigua, cada una con el nombre del amigo creador y el título del tema, e indicando cuando no hay notificaciones. Origen: HU-12 (CA-12.2, CA-12.3).

#### Scenario: Ver notificaciones

- **WHEN** "bruno" abre "Notificaciones" desde el menú principal después de que "ana" cree el tema privado "¿Cena el viernes?"
- **THEN** ve la notificación "ana ha creado una nueva propuesta: ¿Cena el viernes?" en primer lugar

#### Scenario: Sin notificaciones

- **WHEN** un usuario sin notificaciones abre la pantalla de notificaciones
- **THEN** el sistema indica que no hay notificaciones

#### Scenario: Solo las notificaciones propias

- **WHEN** un usuario consulta sus notificaciones
- **THEN** el sistema devuelve únicamente las notificaciones de las que es destinatario

### Requirement: Acceso al tema desde la notificación

El sistema SHALL llevar al usuario a la pantalla del tema privado al pulsar una notificación. Origen: HU-12 (CA-12.4).

#### Scenario: Pulsar una notificación

- **WHEN** "bruno" pulsa la notificación del tema privado de "ana"
- **THEN** el sistema abre la pantalla de ese tema con los botones de voto
