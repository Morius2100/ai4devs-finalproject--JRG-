## Purpose

Control de acceso a temas privados: solo el creador y sus amigos pueden verlos, votarlos y ver sus opiniones. Cualquier otro usuario recibe la misma respuesta que si el tema no existiera. Origen: HU-11 de la definición del producto.

## Requirements

### Requirement: Acceso de los amigos del creador

El sistema SHALL permitir a los usuarios de la lista de amigos del creador de un tema privado acceder al tema, votarlo y, tras votar, ver sus resultados y opiniones. Origen: HU-11 (CA-11.1).

#### Scenario: Amigo accede a un tema privado

- **WHEN** "bruno", amigo de "ana", abre un tema privado creado por "ana"
- **THEN** el sistema muestra el tema con sus botones de voto

#### Scenario: Amigo vota un tema privado

- **WHEN** "bruno" vota el tema privado de "ana"
- **THEN** el voto se registra y "bruno" ve los totales y las opiniones

### Requirement: Denegación a usuarios que no son amigos

El sistema SHALL tratar un tema privado como inexistente (`404`) para cualquier usuario que no sea su creador ni amigo del creador, en la consulta del tema, en la emisión de votos y en la lista de opiniones, aunque conozca su identificador. Origen: HU-11 (CA-11.2, CA-11.3).

#### Scenario: No amigo abre el tema

- **WHEN** "dani", que no es amigo de "ana", abre la URL de un tema privado de "ana"
- **THEN** el sistema muestra la pantalla de "tema no encontrado"

#### Scenario: No amigo intenta votar

- **WHEN** "dani" envía un voto al tema privado de "ana"
- **THEN** el sistema responde `404` y no registra el voto

#### Scenario: No amigo pide opiniones

- **WHEN** "dani" solicita las opiniones del tema privado de "ana"
- **THEN** el sistema responde `404`

### Requirement: Acceso del creador

El sistema SHALL permitir siempre al creador acceder a su propio tema privado, votarlo y ver sus resultados. Origen: HU-11 (CA-11.4).

#### Scenario: Creador abre su tema privado

- **WHEN** "ana" abre su propio tema privado
- **THEN** el sistema muestra el tema
