## MODIFIED Requirements

### Requirement: Temas en forma de tarjeta

El sistema SHALL mostrar cada tema de la lista de tendencias o de búsqueda como una tarjeta pulsable que incluye el título, una miniatura de la imagen si el tema la tiene y el número total de votos. Un tema sin imagen SHALL mostrarse sin miniatura ni hueco vacío equivalente a una imagen rota. El orden y el contenido de la lista SHALL NOT cambiar. En la web, la dirección anterior `/temas/<id>` SHALL redirigir de forma permanente a `/tema?id=<id>`. Origen: HU-01, HU-02, HU-16 (CA-16.1).

#### Scenario: Tema con imagen en la lista
- **WHEN** la lista de tendencias incluye un tema con imagen y 12 votos
- **THEN** su tarjeta muestra la miniatura, el título y el indicador "12 votos", y al pulsarla se abre `/tema?id=<id>`

#### Scenario: Tema sin imagen en la lista
- **WHEN** la lista incluye un tema sin imagen
- **THEN** su tarjeta muestra un marcador visual neutro con la inicial del título en lugar de la miniatura

#### Scenario: Enlace antiguo a un tema en la web
- **WHEN** el usuario abre en el navegador `/temas/{id}` de un tema existente
- **THEN** el sistema lo redirige a `/tema?id={id}` y muestra el tema
