## Purpose

Presentación de un tema individual: título, imagen adjunta (si existe) en la mitad superior de la pantalla, y botones de voto o resultados según si el usuario ya ha votado. Es la pantalla sobre la que se construye la votación. Origen: HU-03 de la definición del producto.

## Requirements

### Requirement: Título del tema

El sistema SHALL mostrar el título del tema al entrar en su pantalla. Origen: HU-03 (CA-03.1).

#### Scenario: Entrar en un tema público

- **WHEN** el usuario abre la pantalla de un tema público existente
- **THEN** el sistema muestra el título del tema

### Requirement: Imagen del tema en la mitad superior

El sistema SHALL mostrar la imagen adjunta del tema, si existe, en la parte superior de la pantalla ocupando la mitad superior de la pantalla del móvil. Si el tema no tiene imagen, el sistema SHALL NOT reservar espacio para ella. Origen: HU-03 (CA-03.2, CA-03.3).

#### Scenario: Tema con imagen

- **WHEN** el usuario abre un tema que tiene imagen adjunta en un móvil de 844 px de alto
- **THEN** la imagen aparece en la parte superior con una altura igual a la mitad de la pantalla (422 px) y el ancho completo

#### Scenario: Tema sin imagen

- **WHEN** el usuario abre un tema sin imagen
- **THEN** no se muestra imagen ni hueco reservado y el título aparece en la parte superior

### Requirement: Botones de voto

El sistema SHALL mostrar, en la parte inferior de la pantalla de un tema que el usuario aún no ha votado, dos botones: pulgar arriba de color verde y pulgar abajo de color rojo. Origen: HU-03 (CA-03.4).

#### Scenario: Usuario que no ha votado

- **WHEN** el usuario abre un tema que no ha votado
- **THEN** en la parte inferior aparecen un botón de pulgar arriba verde y un botón de pulgar abajo rojo, cada uno con una etiqueta accesible

### Requirement: Resultados si el usuario ya votó

El sistema SHALL mostrar los resultados de la votación en lugar de los botones cuando el usuario ya ha votado el tema, y SHALL NOT devolver los totales a un usuario que no ha votado. Origen: HU-03 (CA-03.5), supuesto S-03.

#### Scenario: Usuario que ya votó

- **WHEN** el usuario abre un tema que ya votó
- **THEN** el sistema no muestra los botones de voto y muestra la vista de resultados

#### Scenario: Totales ocultos antes de votar

- **WHEN** un usuario que no ha votado solicita el detalle del tema
- **THEN** la respuesta indica que no ha votado y no incluye los totales de votos

### Requirement: Tema no encontrado

El sistema SHALL mostrar una pantalla de "tema no encontrado" (respuesta `404`) cuando el tema no existe o el usuario no tiene acceso a él según la política de visibilidad (los temas públicos son accesibles para todos los usuarios y los privados según la capacidad `temas-privados`). Origen: HU-03 (CA-03.6).

#### Scenario: Tema inexistente

- **WHEN** el usuario abre la pantalla de un identificador de tema que no existe
- **THEN** el sistema muestra la pantalla de "tema no encontrado"

#### Scenario: Tema privado ajeno

- **WHEN** un usuario solicita un tema privado al que no tiene acceso
- **THEN** el sistema responde igual que para un tema inexistente
