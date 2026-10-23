## ADDED Requirements

### Requirement: Inicio del proceso de voto

El sistema SHALL iniciar el proceso de votación con el valor correspondiente cuando el usuario pulsa uno de los dos botones: pulgar arriba = voto positivo, pulgar abajo = voto negativo. Origen: HU-04 (CA-04.1).

#### Scenario: Pulsar pulgar arriba

- **WHEN** el usuario pulsa el botón verde de pulgar arriba
- **THEN** el sistema inicia el proceso de voto con valor positivo y solicita la justificación

#### Scenario: Pulsar pulgar abajo

- **WHEN** el usuario pulsa el botón rojo de pulgar abajo
- **THEN** el sistema inicia el proceso de voto con valor negativo y solicita la justificación

### Requirement: Justificación opcional del voto

El sistema SHALL solicitar una justificación del voto tras pulsar un botón de voto, permitiendo confirmar el voto con la justificación vacía o con un texto de hasta 500 caracteres. Una justificación compuesta solo por espacios SHALL tratarse como vacía. Origen: HU-05 (CA-05.1–CA-05.4).

#### Scenario: Votar sin justificación

- **WHEN** el usuario deja el campo de justificación vacío y confirma
- **THEN** el sistema registra el voto sin justificación

#### Scenario: Votar con justificación

- **WHEN** el usuario escribe "Me parece justo" y confirma
- **THEN** el sistema registra el voto con esa justificación

#### Scenario: Justificación demasiado larga

- **WHEN** el usuario intenta confirmar una justificación de más de 500 caracteres
- **THEN** el sistema rechaza el voto indicando el límite y no lo registra

#### Scenario: Justificación solo con espacios

- **WHEN** el usuario confirma una justificación formada solo por espacios
- **THEN** el sistema registra el voto sin justificación

### Requirement: Cancelar el proceso de voto

El sistema SHALL permitir cancelar el proceso antes de confirmar, sin registrar ningún voto. Origen: HU-04 (CA-04.4).

#### Scenario: Cancelar

- **WHEN** el usuario pulsa un botón de voto y después cancela la solicitud de justificación
- **THEN** no se registra ningún voto y siguen visibles los dos botones

### Requirement: Voto único por usuario y tema

El sistema SHALL registrar como máximo un voto por usuario y tema, y SHALL rechazar cualquier intento posterior con un error de conflicto. Origen: HU-04 (CA-04.2, CA-04.3), supuesto S-03.

#### Scenario: Primer voto

- **WHEN** un usuario confirma su voto en un tema que no había votado
- **THEN** el sistema registra el voto e incrementa en uno el total correspondiente (positivo o negativo)

#### Scenario: Segundo voto

- **WHEN** un usuario que ya votó un tema envía otro voto sobre ese tema
- **THEN** el sistema responde con un conflicto `409` y los totales no cambian

#### Scenario: Votos concurrentes del mismo usuario

- **WHEN** el mismo usuario envía dos votos simultáneos sobre el mismo tema
- **THEN** solo uno se registra y el total del tema aumenta exactamente en uno

#### Scenario: Votar un tema sin acceso

- **WHEN** un usuario envía un voto sobre un tema inexistente o al que no tiene acceso
- **THEN** el sistema responde `404` y no registra el voto

### Requirement: Resultados tras votar

El sistema SHALL transformar los dos botones de voto, sin recargar la página, en una vista que muestra el total de votos positivos y el total de votos negativos del tema, incluyendo el voto recién emitido y todos los votos con o sin justificación. Origen: HU-06 (CA-06.1–CA-06.3).

#### Scenario: Ver totales tras votar

- **WHEN** un tema tiene 3 votos positivos y 1 negativo y el usuario confirma un voto negativo
- **THEN** los botones desaparecen y se muestran 3 votos positivos y 2 votos negativos

### Requirement: Lista de opiniones coloreada

El sistema SHALL mostrar, tras votar, la lista de opiniones del tema (votos con justificación), de más reciente a más antigua y con carga continua, mostrando el nombre de usuario del autor y su justificación, en verde si el autor votó positivo y en rojo si votó negativo. Origen: HU-07 (CA-07.1–CA-07.4).

#### Scenario: Opiniones con colores

- **WHEN** el usuario ha votado un tema en el que "ana" votó positivo con justificación y "bruno" votó negativo con justificación
- **THEN** la opinión de "ana" se muestra en verde y la de "bruno" en rojo, cada una con su nombre de usuario y su texto

#### Scenario: Votos sin justificación no son opiniones

- **WHEN** un tema tiene votos sin justificación
- **THEN** esos votos cuentan en los totales pero no aparecen en la lista de opiniones

#### Scenario: Muchas opiniones

- **WHEN** un tema tiene 30 opiniones y el usuario llega al final de la lista
- **THEN** el sistema carga las 10 restantes sin repetir ninguna

### Requirement: Estado sin opiniones

El sistema SHALL indicar que aún no hay opiniones cuando ningún votante ha dejado justificación. Origen: HU-07 (CA-07.5).

#### Scenario: Tema sin opiniones

- **WHEN** el usuario vota un tema en el que nadie ha escrito justificación
- **THEN** se muestran los totales y un mensaje indicando que aún no hay opiniones

### Requirement: Opiniones solo para quien ha votado

El sistema SHALL denegar la lista de opiniones de un tema a un usuario que no lo ha votado. Origen: HU-07 (CA-07.6).

#### Scenario: Solicitar opiniones sin haber votado

- **WHEN** un usuario que no ha votado un tema solicita sus opiniones
- **THEN** el sistema responde `403`
