## ADDED Requirements

### Requirement: Fecha de creación en la tarjeta de tema

El sistema SHALL mostrar en cada tarjeta de tema (tendencias, búsqueda y temas de un perfil) la fecha de creación del tema, justo al lado del chip con el número de votos y con el mismo estilo de chip. La fecha SHALL expresarse así:

- menos de 1 minuto: «ahora»;
- menos de 1 hora: «hace N min»;
- menos de 24 horas: «hace N h»;
- menos de 7 días: «hace N d»;
- a partir de 7 días: día y mes abreviado («12 sept»), con el año si no es el año en curso («12 sept 2025»).

La fecha SHALL marcarse como `<time>` con la fecha completa en `dateTime` y SHALL anunciarse a tecnologías de asistencia como «Creado …». Origen: HU-17 (CA-17.1, CA-17.2).

#### Scenario: Tema reciente
- **WHEN** la lista de tendencias incluye un tema con 12 votos creado hace 3 horas
- **THEN** su tarjeta muestra los chips «12 votos» y «hace 3 h», uno junto al otro

#### Scenario: Tema de hace más de una semana
- **WHEN** hoy es 30 de septiembre de 2026 y un tema se creó el 12 de septiembre de 2026
- **THEN** su tarjeta muestra el chip «12 sept»

#### Scenario: Tema de otro año
- **WHEN** hoy es 30 de septiembre de 2026 y un tema se creó el 3 de marzo de 2025
- **THEN** su tarjeta muestra el chip «3 mar 2025»

#### Scenario: Fecha accesible
- **WHEN** un lector de pantalla recorre la tarjeta de un tema creado hace 5 minutos
- **THEN** anuncia «Creado hace 5 min»

### Requirement: Tarjeta de un tema ya votado

El sistema SHALL marcar en todas las listas de temas las tarjetas de los temas que el usuario ya ha votado:

- fondo verde suave si su voto fue a favor, y rojo suave si fue en contra, legibles en modo claro y oscuro;
- junto al chip de votos y de fecha, el número de votos a favor con el icono de pulgar arriba y el de votos en contra con el icono de pulgar abajo;
- una etiqueta accesible «Has votado a favor» o «Has votado en contra», para no depender solo del color.

Las tarjetas de temas no votados SHALL mantener el fondo neutro y SHALL NOT mostrar el desglose a favor/en contra. La API de listados (`GET /api/topics` y `GET /api/users/:id/topics`) SHALL incluir en cada tema `myVote` (`UP`, `DOWN` o `null`) y SHALL incluir los votos a favor y en contra solo cuando `myVote` no sea `null` (supuesto S-03). Tras votar un tema, las listas SHALL mostrar su tarjeta marcada sin necesidad de recargar la aplicación. Origen: HU-18 (CA-18.1–CA-18.4), HU-06, supuesto S-03.

#### Scenario: Tema votado a favor
- **WHEN** el usuario ha votado a favor un tema con 8 votos a favor y 4 en contra y abre la pantalla de temas
- **THEN** la tarjeta de ese tema tiene fondo verde suave y muestra «12 votos», la fecha, «8» con pulgar arriba y «4» con pulgar abajo

#### Scenario: Tema votado en contra
- **WHEN** el usuario ha votado en contra un tema
- **THEN** su tarjeta tiene fondo rojo suave y muestra el desglose de votos a favor y en contra

#### Scenario: Tema no votado
- **WHEN** la lista incluye un tema que el usuario no ha votado
- **THEN** su tarjeta tiene fondo neutro, muestra solo el total de votos y la fecha, y la respuesta de la API para ese tema tiene `myVote: null` y no incluye votos a favor ni en contra

#### Scenario: Voto propio accesible
- **WHEN** un lector de pantalla recorre la tarjeta de un tema votado en contra
- **THEN** anuncia «Has votado en contra» además del título y los votos

#### Scenario: Volver a la lista tras votar
- **WHEN** el usuario abre un tema desde la lista, lo vota a favor y vuelve atrás
- **THEN** la tarjeta de ese tema aparece con fondo verde suave y el desglose de votos actualizado

#### Scenario: Temas del perfil de una persona
- **WHEN** el usuario abre el perfil de una persona con un tema que ya ha votado
- **THEN** la tarjeta de ese tema aparece marcada igual que en la pantalla de temas
