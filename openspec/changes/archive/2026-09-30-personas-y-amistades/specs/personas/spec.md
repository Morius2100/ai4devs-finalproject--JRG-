## ADDED Requirements

### Requirement: Lista de personas

El sistema SHALL mostrar en la pantalla Personas una lista con todos los usuarios registrados salvo el propio usuario. La lista SHALL estar ordenada por nombre de usuario de forma alfabética y sin distinguir mayúsculas y minúsculas. Cada elemento SHALL mostrar:

- la foto de perfil o, si no tiene, un marcador circular con la inicial del nombre;
- el nombre de usuario;
- un indicador «Amigo» o «No amigo» según la relación con quien mira.

Origen: HU-13 (CA-13.2).

#### Scenario: Lista con indicador de amistad

- **WHEN** "ana", amiga de "bruno" y no de "dani", abre la pantalla Personas
- **THEN** la lista muestra a "bruno" con el indicador «Amigo» y a "dani" con «No amigo», y no muestra a "ana"

#### Scenario: Persona sin foto

- **WHEN** la lista incluye a un usuario "carla" sin foto de perfil
- **THEN** su elemento muestra un círculo con la letra "C" en lugar de la foto

#### Scenario: Sin otras personas

- **WHEN** el único usuario registrado abre la pantalla Personas
- **THEN** el sistema muestra un estado vacío indicando que todavía no hay personas

### Requirement: Buscador de personas

El sistema SHALL mostrar en la parte superior de la pantalla Personas un buscador con el mismo aspecto que el buscador de temas. El buscador SHALL filtrar la lista a los usuarios cuyo nombre de usuario contenga el texto introducido, sin distinguir mayúsculas y minúsculas y tratando `%`, `_` y `\` como caracteres literales. Además:

- La búsqueda SHALL lanzarse tras 300 ms sin escribir.
- La búsqueda SHALL reflejarse en la URL como `?q=`.
- Vaciar el campo SHALL volver a la lista completa.

Origen: HU-13 (CA-13.3).

#### Scenario: Buscar por parte del nombre

- **WHEN** el usuario escribe "AR" y existen "carla", "mario" y "bruno"
- **THEN** la lista muestra solo a "carla" y "mario"

#### Scenario: Sin resultados

- **WHEN** el usuario busca un texto que no coincide con ningún nombre
- **THEN** el sistema muestra un estado vacío indicando que no se han encontrado personas

#### Scenario: Búsqueda compartible

- **WHEN** el usuario abre `/personas?q=car`
- **THEN** el buscador muestra "car" y la lista ya aparece filtrada

### Requirement: Carga continua de personas

El sistema SHALL cargar la lista de personas en páginas de 20 conforme el usuario se acerca al final, sin repetir ni omitir personas entre páginas. Origen: HU-13 (CA-13.4).

#### Scenario: Más de una página

- **WHEN** existen 45 personas visibles y el usuario hace scroll hasta el final dos veces
- **THEN** la lista muestra las 45 personas en orden alfabético y sin repeticiones

### Requirement: Acceso al perfil desde la lista

El sistema SHALL abrir el perfil de una persona (`/personas/[id]`) al pulsar su elemento en la lista. Cada elemento SHALL tener un área táctil mínima de 44 px de alto. Origen: HU-14 (CA-14.1).

#### Scenario: Abrir un perfil

- **WHEN** el usuario pulsa sobre "bruno" en la lista de personas
- **THEN** el sistema muestra el perfil de "bruno"

### Requirement: Cabecera del perfil

El sistema SHALL mostrar en la parte superior del perfil una cabecera con el fondo amarillo de marca. La cabecera SHALL contener:

- la foto de perfil grande o, si no tiene, un marcador circular con la inicial;
- el nombre de usuario;
- la descripción breve, si existe. Si el usuario no tiene descripción, SHALL omitirse sin dejar un hueco vacío.

Origen: HU-14 (CA-14.2).

#### Scenario: Perfil completo

- **WHEN** el usuario abre el perfil de "bruno", que tiene foto y la descripción "Me encanta debatir"
- **THEN** la cabecera muestra la foto, el nombre "bruno" y el texto "Me encanta debatir"

#### Scenario: Perfil sin foto ni descripción

- **WHEN** el usuario abre el perfil de "dani", sin foto ni descripción
- **THEN** la cabecera muestra un círculo con la letra "D" y el nombre, sin ningún texto de descripción

### Requirement: Temas creados en el perfil

El sistema SHALL mostrar, debajo de la sección de amistad del perfil, los temas creados por esa persona a los que quien mira tiene acceso según la política de visibilidad:

- los temas públicos siempre;
- los privados solo si quien mira es amigo de esa persona o es la propia persona.

Cada tema SHALL mostrarse con la misma tarjeta que en la pantalla de temas. Los privados SHALL llevar además la etiqueta «Privado». Pulsar un tema SHALL abrirlo. La lista SHALL cargarse en páginas de 20. Origen: HU-14 (CA-14.3).

#### Scenario: Visitante que no es amigo

- **WHEN** "dani", que no es amigo de "ana", abre el perfil de "ana", que tiene 2 temas públicos y 1 privado
- **THEN** el perfil muestra solo los 2 temas públicos

#### Scenario: Visitante amigo

- **WHEN** "bruno", amigo de "ana", abre el mismo perfil
- **THEN** el perfil muestra los 3 temas y el privado lleva la etiqueta «Privado»

#### Scenario: Persona sin temas

- **WHEN** el usuario abre el perfil de alguien que no ha creado temas visibles para él
- **THEN** el sistema indica que esta persona todavía no tiene temas

### Requirement: Orden de los temas del perfil

El sistema SHALL mostrar justo encima de los temas del perfil un selector con dos opciones:

- **«Más recientes»**: fecha de creación descendente. Es la opción por defecto.
- **«Más puntuados»**: número total de votos descendente y, a igualdad, fecha de creación descendente.

Al cambiar de opción, la lista SHALL recargarse desde el principio en el nuevo orden. El selector SHALL indicar a tecnologías de asistencia qué opción está seleccionada. Origen: HU-14 (CA-14.4).

#### Scenario: Orden por defecto

- **WHEN** el usuario abre el perfil de "ana", cuyos temas son A (creado hace 3 días, 50 votos), B (hace 1 día, 5 votos) y C (hace 2 días, 20 votos)
- **THEN** la lista muestra B, C, A y «Más recientes» aparece seleccionado

#### Scenario: Más puntuados

- **WHEN** en ese perfil el usuario elige «Más puntuados»
- **THEN** la lista muestra A, C, B

### Requirement: Perfil inexistente

El sistema SHALL mostrar una pantalla «Persona no encontrada», con un enlace de vuelta a Personas, cuando el identificador del perfil no tenga un formato válido o no corresponda a ningún usuario. La API SHALL responder `404` en esos casos. Origen: HU-14 (CA-14.5).

#### Scenario: Identificador desconocido

- **WHEN** el usuario abre `/personas/00000000-0000-0000-0000-000000000000` y no existe ese usuario
- **THEN** el sistema muestra «Persona no encontrada» y un enlace a `/personas`

### Requirement: Datos de perfil mínimos

El sistema SHALL guardar para cada usuario una URL de foto de perfil y una descripción breve de hasta 160 caracteres, ambas opcionales. El sistema SHALL NOT exponer el email de otros usuarios en las respuestas de personas o perfil. Origen: HU-13 (CA-13.2), HU-14 (CA-14.2).

#### Scenario: Respuesta sin datos privados

- **WHEN** un usuario pide `GET /api/users`
- **THEN** cada persona de la respuesta incluye solo `id`, `username`, `avatarUrl` e `isFriend`, y nunca su email ni su contraseña

#### Scenario: Usuario registrado sin perfil

- **WHEN** un usuario se registra con nombre, email y contraseña
- **THEN** queda creado sin foto ni descripción y aparece en la lista de personas con su inicial
