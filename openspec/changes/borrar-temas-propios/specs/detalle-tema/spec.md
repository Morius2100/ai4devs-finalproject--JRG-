## ADDED Requirements

### Requirement: El detalle indica si el visitante es el autor

El sistema SHALL incluir en el detalle de un tema (`GET /api/topics/:id`) el campo booleano `isAuthor`, verdadero solo cuando el visitante autenticado es quien creó el tema, y SHALL NOT incluir el identificador ni otros datos personales del autor. El campo SHALL usarse únicamente para decidir qué controles mostrar; la autorización de las acciones del autor se comprueba siempre en el servidor. Origen: HU-23 (CA-23.1, CA-23.2).

#### Scenario: Detalle visto por el autor

- **WHEN** el autor solicita el detalle de su tema
- **THEN** la respuesta incluye `isAuthor: true`

#### Scenario: Detalle visto por otra persona

- **WHEN** otra persona con acceso solicita el detalle de ese tema
- **THEN** la respuesta incluye `isAuthor: false` y no contiene el identificador del autor

#### Scenario: Pantalla según autoría

- **WHEN** la pantalla de detalle recibe `isAuthor: true`
- **THEN** muestra el botón de papelera, y con `isAuthor: false` no lo muestra
