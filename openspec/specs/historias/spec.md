## Purpose

Historias de amigos en la pantalla de temas: burbujas con los temas que los amigos han creado en las últimas 24 horas y el usuario aún no ha abierto, y registro de los temas visitados. Origen: HU-19 (cambio `historias-amigos`).

## Requirements

### Requirement: Burbujas de historias en la pantalla de temas

El sistema SHALL mostrar en la pantalla de temas, entre el buscador y la lista y solo mientras no haya una búsqueda activa, una fila de burbujas desplazable en horizontal. La fila SHALL tener una burbuja por cada amigo con al menos un tema pendiente de ver. Cada burbuja SHALL mostrar:

- la foto de perfil del amigo o, si no tiene, un círculo con su inicial;
- un anillo de color de marca alrededor;
- el nombre de usuario debajo;
- si tiene más de un tema pendiente, un contador con ese número.

Las burbujas SHALL ordenarse por la fecha de su tema pendiente más reciente, de más nueva a más antigua. Si no hay ningún amigo con temas pendientes, la fila SHALL NOT mostrarse ni dejar un hueco vacío. Cada burbuja SHALL ser un enlace con área táctil mínima de 44 × 44 px y nombre accesible «Nuevo tema de <nombre>» o «N temas nuevos de <nombre>». La fila SHALL tener el nombre accesible «Historias de tus amigos». Origen: HU-19 (CA-19.1, CA-19.2).

#### Scenario: Amigo con un tema nuevo
- **WHEN** "bruno", amigo de "ana", creó un tema público hace 2 horas que "ana" no ha abierto, y "ana" abre la pantalla de temas
- **THEN** encima de la lista aparece una burbuja con la foto de "bruno", su nombre y el nombre accesible «Nuevo tema de bruno»

#### Scenario: Varios temas pendientes del mismo amigo
- **WHEN** "carla", amiga de "ana", creó 3 temas en las últimas 24 horas y "ana" no ha abierto ninguno
- **THEN** aparece una sola burbuja de "carla" con el contador «3»

#### Scenario: Orden de las burbujas
- **WHEN** el tema pendiente más reciente de "bruno" es de hace 1 hora y el de "carla" de hace 5 horas
- **THEN** la burbuja de "bruno" aparece antes que la de "carla"

#### Scenario: Sin historias
- **WHEN** ningún amigo de "ana" tiene temas pendientes
- **THEN** la pantalla de temas muestra el buscador y la lista sin fila de burbujas

#### Scenario: Búsqueda activa
- **WHEN** "ana" tiene historias pendientes y escribe una búsqueda
- **THEN** la fila de burbujas se oculta mientras la búsqueda está activa y vuelve al vaciarla

### Requirement: Temas pendientes de ver

El sistema SHALL considerar que un tema está pendiente de ver para un usuario cuando se cumplen todas estas condiciones:

- su autor es amigo del usuario en ese momento;
- se creó en las últimas 24 horas;
- el usuario no lo ha abierto nunca.

Cuentan tanto los temas públicos como los privados, porque ambos son accesibles para los amigos según la política de visibilidad. Los temas creados por el propio usuario SHALL NOT aparecer nunca en sus historias. `GET /api/stories` SHALL devolver, para el usuario de la sesión, los amigos con temas pendientes, ordenados según el requisito anterior, y para cada amigo los identificadores de sus temas pendientes de más antiguo a más nuevo. Sin sesión SHALL responder `401`. Origen: HU-19 (CA-19.3).

#### Scenario: Tema de hace más de 24 horas
- **WHEN** "bruno" creó un tema hace 25 horas que "ana" no ha abierto
- **THEN** ese tema no aparece en las historias de "ana"

#### Scenario: Tema privado de un amigo
- **WHEN** "bruno" crea un tema privado y "ana" es su amiga
- **THEN** el tema aparece en las historias de "ana"

#### Scenario: Persona que no es amiga
- **WHEN** "dani", que no es amigo de "ana", crea un tema público
- **THEN** ese tema no aparece en las historias de "ana"

#### Scenario: Se deja de ser amigos
- **WHEN** "ana" tiene una burbuja de "bruno" y quita a "bruno" de amigos
- **THEN** al volver a la pantalla de temas la burbuja de "bruno" ya no aparece

#### Scenario: Temas propios
- **WHEN** "ana" crea un tema
- **THEN** ese tema no aparece nunca en sus propias historias

### Requirement: Abrir una historia

Al pulsar una burbuja, el sistema SHALL abrir la pantalla del tema pendiente más antiguo de ese amigo. Al volver a la pantalla de temas, las burbujas SHALL reflejar el tema ya visto sin recargar la aplicación: la burbuja desaparece si el amigo ya no tiene temas pendientes, o su contador baja y la siguiente pulsación abre el siguiente tema pendiente. Origen: HU-19 (CA-19.4).

#### Scenario: Abrir el único tema pendiente
- **WHEN** "ana" pulsa la burbuja de "bruno", que tiene un tema pendiente, y después vuelve atrás
- **THEN** se abre ese tema y, al volver, la burbuja de "bruno" ya no aparece

#### Scenario: Recorrer varios temas pendientes
- **WHEN** "carla" tiene los temas pendientes C1 (hace 5 h) y C2 (hace 2 h) y "ana" pulsa su burbuja
- **THEN** se abre C1; al volver, la burbuja de "carla" sigue visible sin contador y pulsarla abre C2

### Requirement: Registro de temas visitados

El sistema SHALL registrar que un usuario ha visto un tema cada vez que abre con éxito la pantalla de un tema de otro autor, llegue desde donde llegue: lista, notificación, perfil o burbuja. Abrir el mismo tema varias veces SHALL NOT crear registros duplicados. El sistema SHALL NOT registrar la visita cuando el tema no existe o el usuario no tiene acceso a él. Origen: HU-19 (CA-19.5).

#### Scenario: Tema abierto desde la lista
- **WHEN** "ana" abre desde la pantalla de temas un tema nuevo de "bruno", sin pasar por su burbuja
- **THEN** el tema queda registrado como visto y deja de contar para la burbuja de "bruno"

#### Scenario: Tema abierto dos veces
- **WHEN** "ana" abre dos veces el mismo tema de "bruno"
- **THEN** existe un único registro de visita de "ana" para ese tema

#### Scenario: Tema sin acceso
- **WHEN** "dani" intenta abrir un tema privado de "ana" sin ser su amigo
- **THEN** el sistema muestra «Tema no encontrado» y no registra ninguna visita
