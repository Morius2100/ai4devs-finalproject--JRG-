## MODIFIED Requirements

### Requirement: Añadir a amigos

El sistema SHALL, al pulsar el check en el perfil de alguien que no es amigo, crear una **solicitud de amistad** hacia esa persona, sin crear todavía la amistad. La amistad se crea, en ambos sentidos y de forma atómica, solo cuando la otra persona acepta la solicitud. Mientras la solicitud esté pendiente, el botón SHALL mostrar «Solicitud enviada» y ninguna de las dos personas SHALL obtener acceso a los temas privados de la otra. Repetir la solicitud SHALL NOT crear duplicados ni producir un error. Si la persona destinataria ya había enviado una solicitud al solicitante, la nueva solicitud SHALL aceptarla y crear la amistad. Origen: HU-15 (CA-15.1, CA-15.5), tarea T6 de la Revisión 1.

#### Scenario: Enviar una solicitud

- **WHEN** "ana" pulsa «Añadir a amigos» en el perfil de "dani"
- **THEN** el botón pasa a «Solicitud enviada», existe una solicitud de "ana" a "dani" y no existe ninguna fila en `friendships`

#### Scenario: Petición repetida

- **WHEN** se envía dos veces `PUT /api/users/{id-de-dani}/friendship` en nombre de "ana"
- **THEN** ambas respuestas indican `status: "PENDING"` y existe exactamente una solicitud

#### Scenario: Solicitudes cruzadas

- **WHEN** "dani" tiene una solicitud pendiente de "ana" y "dani" pulsa «Añadir a amigos» en el perfil de "ana"
- **THEN** la solicitud se acepta, existen las dos filas de `friendships` y ambos aparecen como «Amigo»

#### Scenario: Sin acceso mientras está pendiente

- **WHEN** "dani" tiene una solicitud pendiente hacia "ana" y abre la URL de un tema privado de "ana"
- **THEN** el sistema responde como si el tema no existiera (`404`)

## ADDED Requirements

### Requirement: Aceptar o rechazar una solicitud

El sistema SHALL permitir a la persona destinataria aceptar o rechazar cada solicitud recibida desde una lista de solicitudes en la pantalla de personas. Al aceptar, SHALL crear la amistad en ambos sentidos de forma atómica y eliminar la solicitud. Al rechazar, SHALL eliminar la solicitud sin avisar al solicitante y SHALL permitir que este envíe otra más adelante. Solo la persona destinataria SHALL poder aceptar o rechazar; cualquier otra recibe `404`. Origen: HU-15, tarea T6 de la Revisión 1.

#### Scenario: Aceptar

- **WHEN** "dani" acepta la solicitud de "ana"
- **THEN** "ana" y "dani" son amigos mutuos, la solicitud desaparece y cada uno puede acceder a los temas privados del otro

#### Scenario: Rechazar

- **WHEN** "dani" rechaza la solicitud de "ana"
- **THEN** la solicitud desaparece, no se crea ninguna amistad y el perfil de "dani" vuelve a mostrar «Añadir a amigos» a "ana"

#### Scenario: Aceptar una solicitud ajena

- **WHEN** "bruno" intenta aceptar una solicitud dirigida a "dani"
- **THEN** el sistema responde `404` y no crea ninguna amistad

### Requirement: Cancelar una solicitud enviada

El sistema SHALL permitir al solicitante cancelar una solicitud pendiente pulsando de nuevo el botón «Solicitud enviada». Cancelar una solicitud inexistente SHALL NOT producir un error. Origen: HU-15, tarea T6 de la Revisión 1.

#### Scenario: Cancelar

- **WHEN** "ana" pulsa «Solicitud enviada» en el perfil de "dani"
- **THEN** la solicitud desaparece y el botón vuelve a «Añadir a amigos»

### Requirement: El acceso privado exige amistad aceptada

El sistema SHALL conceder el acceso a temas privados, historias y notificaciones de otra persona únicamente cuando exista una amistad aceptada entre ambas, y SHALL NOT concederlo por una solicitud pendiente ni por la acción de una sola de las partes. Las amistades anteriores a este cambio se consideran aceptadas. Origen: HU-11, HU-12, HU-19, tarea T6 de la Revisión 1.

#### Scenario: Una sola parte no basta

- **WHEN** "dani" envía una solicitud a "ana" y "ana" no la acepta
- **THEN** "dani" no ve los temas privados de "ana" ni en su perfil, ni en historias, ni por URL directa, y no recibe sus notificaciones

#### Scenario: Amistades existentes

- **WHEN** se aplica la migración
- **THEN** las filas existentes de `friendships` se mantienen y esas amistades siguen concediendo acceso
