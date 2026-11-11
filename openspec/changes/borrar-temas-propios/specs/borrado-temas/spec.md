## ADDED Requirements

### Requirement: Botón de papelera solo para el autor

El sistema SHALL mostrar, en la pantalla de detalle de un tema, un botón con una papelera y nombre accesible «Borrar tema» únicamente al usuario que creó ese tema. El sistema SHALL NOT mostrarlo en temas creados por otras personas ni en ninguna otra pantalla. Origen: HU-23 (CA-23.1, CA-23.2).

#### Scenario: El autor ve el botón

- **WHEN** el autor de un tema abre la pantalla de detalle de su tema
- **THEN** aparece un botón con una papelera y la etiqueta accesible «Borrar tema»

#### Scenario: Otra persona no ve el botón

- **WHEN** un usuario abre la pantalla de detalle de un tema creado por otra persona, público o privado al que tiene acceso
- **THEN** no aparece el botón de papelera

#### Scenario: Solo en el detalle

- **WHEN** el autor ve sus temas en tendencias, búsqueda o su perfil
- **THEN** ninguna de esas pantallas ofrece borrar el tema

### Requirement: Diseño coherente del botón

El sistema SHALL presentar el botón de papelera con el estilo de la aplicación: icono de trazo que hereda el color del texto, forma circular, área táctil de al menos 44 px, color de peligro del tema y foco visible. El botón SHALL ocupar el mismo lugar, junto al título, con imagen o sin ella. Origen: HU-23 (CA-23.3).

#### Scenario: Botón sin imagen

- **WHEN** el autor abre un tema sin imagen
- **THEN** el botón aparece junto al título, con un área táctil de al menos 44 × 44 px

#### Scenario: Botón con imagen

- **WHEN** el autor abre un tema con imagen
- **THEN** el botón aparece junto al título, fuera de la imagen, y no la tapa

#### Scenario: Accesibilidad

- **WHEN** se analiza la pantalla del autor con axe-core
- **THEN** no hay infracciones WCAG 2.0/2.1 A y AA, incluido el contraste del botón

### Requirement: Confirmación antes de borrar

El sistema SHALL pedir confirmación antes de borrar: un diálogo con el texto «¿Borrar este tema?», el aviso de que se borrarán también sus votos y opiniones y de que no se puede deshacer, y las acciones «Cancelar» y «Borrar». El foco inicial SHALL estar en «Cancelar», `Esc` SHALL cancelar y el sistema SHALL NOT borrar nada hasta pulsar «Borrar». Origen: HU-23 (CA-23.4).

#### Scenario: Cancelar

- **WHEN** el autor pulsa la papelera y después «Cancelar» (o `Esc`)
- **THEN** el diálogo se cierra, el tema sigue existiendo y la pantalla no cambia

#### Scenario: Confirmar

- **WHEN** el autor pulsa la papelera y después «Borrar»
- **THEN** el sistema borra el tema

#### Scenario: Diálogo accesible

- **WHEN** se abre el diálogo de confirmación
- **THEN** tiene `role="alertdialog"`, el foco está en «Cancelar» y no sale del diálogo con Tab

### Requirement: Solo el autor puede borrar su tema

El sistema SHALL borrar un tema solo si la petición procede de una sesión de su autor. Para cualquier otra petición (tema inexistente, tema de otra persona, público o privado) SHALL responder `404`, y para una petición sin sesión `401`, sin modificar datos. La comprobación SHALL hacerse en el servidor y no depender de que la interfaz oculte el botón. Origen: HU-23 (CA-23.5).

#### Scenario: El autor borra su tema

- **WHEN** el autor envía `DELETE /api/topics/:id` de su tema
- **THEN** la respuesta es `204` y el tema deja de existir

#### Scenario: Otra persona intenta borrarlo

- **WHEN** un usuario que no es el autor envía `DELETE /api/topics/:id` de un tema público
- **THEN** la respuesta es `404` y el tema sigue existiendo con sus votos

#### Scenario: Tema privado ajeno

- **WHEN** un usuario sin acceso al tema privado de otra persona envía `DELETE` sobre él
- **THEN** la respuesta es `404`, igual que para un tema inexistente

#### Scenario: Sin sesión

- **WHEN** se envía `DELETE /api/topics/:id` sin sesión
- **THEN** la respuesta es `401` y no se modifica nada

#### Scenario: Identificador no válido o inexistente

- **WHEN** se envía `DELETE` con un identificador que no es un UUID o que no existe
- **THEN** la respuesta es `404`

#### Scenario: Borrar dos veces

- **WHEN** el autor repite el borrado de un tema ya borrado
- **THEN** la segunda respuesta es `404` y no hay efectos adicionales

### Requirement: Se borra todo lo asociado al tema

Al borrar un tema, el sistema SHALL eliminar también sus votos y opiniones, las notificaciones que lo referencian y las marcas de visto, y SHALL eliminar su imagen del almacenamiento si la tiene. El borrado de la imagen SHALL ser de mejor esfuerzo: un fallo del almacenamiento no impedirá ni revertirá el borrado del tema. Los votos SHALL borrarse solo por la cascada de la base de datos, sin que ningún servicio distinto de `VoteService` escriba votos. Origen: HU-23 (CA-23.6).

#### Scenario: Votos y notificaciones

- **WHEN** el autor borra un tema que tiene votos con opiniones y notificaciones a sus amigos
- **THEN** no queda ninguna fila de `votes`, `notifications` ni `topic_views` de ese tema

#### Scenario: Imagen

- **WHEN** el autor borra un tema con imagen
- **THEN** la imagen se elimina del almacenamiento

#### Scenario: Fallo al borrar la imagen

- **WHEN** el almacenamiento falla al eliminar la imagen
- **THEN** el tema queda borrado, la respuesta sigue siendo `204` y el fallo se registra

#### Scenario: Otros temas intactos

- **WHEN** el autor borra uno de sus temas
- **THEN** sus demás temas, sus votos y los de otras personas en otros temas no cambian

### Requirement: El tema desaparece de la aplicación

Tras borrarlo, el sistema SHALL llevar al autor a la pantalla de temas y SHALL dejar de mostrar el tema en tendencias, búsqueda, perfil, historias y notificaciones. Abrir el enlace del tema SHALL mostrar «tema no encontrado». Origen: HU-23 (CA-23.7).

#### Scenario: Vuelta a temas

- **WHEN** el autor confirma el borrado y la API responde `204`
- **THEN** la aplicación navega a la pantalla de temas

#### Scenario: Listados actualizados

- **WHEN** el autor vuelve a las tendencias, a la búsqueda o a su perfil tras borrar
- **THEN** el tema borrado ya no aparece

#### Scenario: Enlace antiguo

- **WHEN** alguien abre la dirección del tema borrado
- **THEN** ve la pantalla de «tema no encontrado»

#### Scenario: Ya borrado desde otro dispositivo

- **WHEN** el autor confirma el borrado y la API responde `404` porque ya no existe
- **THEN** la aplicación lo trata como borrado y navega a la pantalla de temas

### Requirement: Error al borrar

El sistema SHALL, si el borrado falla por un error distinto de `404`, mantener el diálogo abierto con un mensaje de error y permitir reintentar o cancelar, sin cambiar el tema. Origen: HU-23 (CA-23.8).

#### Scenario: Fallo de red o del servidor

- **WHEN** el autor pulsa «Borrar» y la petición falla con un error de red o `500`
- **THEN** el diálogo sigue abierto, muestra un mensaje de error y los botones vuelven a estar activos
