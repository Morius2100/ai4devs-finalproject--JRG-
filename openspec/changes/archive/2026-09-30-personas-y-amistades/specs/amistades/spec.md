## ADDED Requirements

### Requirement: Check de amistad en el perfil

El sistema SHALL mostrar en el perfil de otra persona, justo debajo de la cabecera, un botón de check a todo el ancho que refleje el estado de amistad:

- **Si son amigos**: píldora verde de marca rellena con icono de check y el texto «Amigos».
- **Si no lo son**: píldora con borde verde, fondo transparente, icono de check y el texto «Añadir a amigos».

El botón SHALL exponer su estado con `aria-pressed`. Origen: HU-15 (CA-15.1).

#### Scenario: Perfil de un amigo

- **WHEN** "ana" abre el perfil de "bruno", que es su amigo
- **THEN** el botón muestra «Amigos» relleno en verde y tiene `aria-pressed="true"`

#### Scenario: Perfil de alguien que no es amigo

- **WHEN** "ana" abre el perfil de "dani", que no es su amigo
- **THEN** el botón muestra «Añadir a amigos» con borde verde y tiene `aria-pressed="false"`

### Requirement: Añadir a amigos

El sistema SHALL, al pulsar el check en el perfil de alguien que no es amigo, crear la amistad en ambos sentidos de forma atómica y sin solicitud ni aceptación. A partir de ese momento, el indicador del perfil y el de la lista de personas SHALL mostrar «Amigo» para ambos usuarios. Repetir la operación sobre una amistad existente SHALL NOT crear duplicados ni producir un error. Origen: HU-15 (CA-15.1, CA-15.5).

#### Scenario: Añadir un amigo

- **WHEN** "ana" pulsa «Añadir a amigos» en el perfil de "dani"
- **THEN** el botón pasa a «Amigos», "dani" aparece como «Amigo» en la lista de "ana" y "ana" aparece como «Amigo» en la lista de "dani"

#### Scenario: Petición repetida

- **WHEN** se envía dos veces `PUT /api/users/{id-de-dani}/friendship` en nombre de "ana"
- **THEN** ambas respuestas indican `isFriend: true` y existe exactamente una fila en cada sentido

### Requirement: Quitar de amigos

El sistema SHALL, al pulsar el check en el perfil de un amigo, eliminar la amistad en ambos sentidos de forma atómica, sin pedir confirmación. Repetir la operación sobre una amistad inexistente SHALL NOT producir un error. Origen: HU-15 (CA-15.2, CA-15.5).

#### Scenario: Quitar un amigo

- **WHEN** "ana" pulsa «Amigos» en el perfil de "bruno"
- **THEN** el botón pasa a «Añadir a amigos» y ni "ana" ni "bruno" figuran ya como amigos del otro

### Requirement: Efecto de la amistad sobre los temas privados

El sistema SHALL aplicar los cambios de amistad de inmediato a la política de acceso de temas privados y a las notificaciones:

- Al añadir un amigo, cada uno SHALL poder acceder a los temas privados del otro y recibir notificaciones de los privados que el otro cree a partir de entonces.
- Al quitarlo, cada uno SHALL dejar de acceder a los temas privados del otro, que se tratan como inexistentes (`404`), y SHALL dejar de recibir esas notificaciones.
- Los temas del perfil SHALL recargarse tras el cambio para reflejar el nuevo acceso.

Origen: HU-15 (CA-15.3), HU-11, HU-12.

#### Scenario: Acceso tras añadir

- **WHEN** "dani" añade a "ana" como amiga y "ana" tiene un tema privado
- **THEN** el perfil de "ana" muestra a "dani" ese tema privado sin recargar la página, y "dani" puede abrirlo y votarlo

#### Scenario: Pérdida de acceso tras quitar

- **WHEN** "bruno" quita a "ana" de amigos y después abre la URL de un tema privado de "ana"
- **THEN** el sistema responde como si el tema no existiera

#### Scenario: Sin notificación tras quitar

- **WHEN** "ana" crea un tema privado después de que "bruno" la haya quitado de amigos
- **THEN** "bruno" no recibe notificación

### Requirement: Propio perfil sin check

El sistema SHALL NOT permitir que un usuario sea amigo de sí mismo. En su propio perfil, al que puede llegar por URL, SHALL NOT mostrar el botón de amistad y SHALL mostrar todos sus temas, incluidos los privados. La API SHALL responder `400` a `PUT` y a `DELETE` sobre `/api/users/{propio-id}/friendship`. Origen: HU-15 (CA-15.4).

#### Scenario: Abrir el propio perfil

- **WHEN** "ana" abre `/personas/{id-de-ana}`
- **THEN** ve su cabecera y todos sus temas, sin botón de amistad

#### Scenario: Intento de auto-amistad por API

- **WHEN** "ana" envía `PUT /api/users/{id-de-ana}/friendship`
- **THEN** el sistema responde `400` y no crea ninguna fila

### Requirement: Cambio de amistad con respuesta inmediata

El sistema SHALL mostrar el nuevo estado del check nada más pulsarlo y mantener el botón deshabilitado hasta recibir la respuesta. Si la petición falla, SHALL restaurar el estado anterior y mostrar un mensaje de error accesible (`role="alert"`). El sistema SHALL responder `404` si la persona no existe. Origen: HU-15 (CA-15.5).

#### Scenario: Fallo de red

- **WHEN** "ana" pulsa «Añadir a amigos» y la petición falla
- **THEN** el botón vuelve a «Añadir a amigos» y se muestra el mensaje «No se ha podido actualizar la amistad»

#### Scenario: Persona inexistente

- **WHEN** se envía `PUT /api/users/{id-inexistente}/friendship`
- **THEN** el sistema responde `404` y no crea ninguna fila
