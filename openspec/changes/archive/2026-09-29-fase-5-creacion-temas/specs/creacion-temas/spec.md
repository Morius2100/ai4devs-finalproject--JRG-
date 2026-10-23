## ADDED Requirements

### Requirement: Acceso a la creación desde el menú principal

El sistema SHALL ofrecer en el menú principal la opción de crear un tema, que abre el formulario de creación. Origen: HU-08 (CA-08.1).

#### Scenario: Abrir el formulario

- **WHEN** el usuario pulsa "Crear tema" en el menú principal
- **THEN** el sistema muestra el formulario de creación de tema

### Requirement: Datos del tema

El sistema SHALL solicitar un título obligatorio de 3 a 120 caracteres (tras eliminar espacios iniciales y finales), una visibilidad obligatoria (pública o privada) y una imagen opcional, y SHALL rechazar la creación si el título no es válido. Origen: HU-08 (CA-08.2, CA-08.4).

#### Scenario: Título vacío o demasiado corto

- **WHEN** el usuario intenta crear un tema con el título "ab"
- **THEN** el sistema muestra un error en el título y no crea el tema

#### Scenario: Título demasiado largo

- **WHEN** el usuario intenta crear un tema con un título de 121 caracteres
- **THEN** el sistema muestra un error en el título y no crea el tema

### Requirement: Creación de un tema público

El sistema SHALL crear el tema público, dejarlo disponible para todos los usuarios en la lista de tendencias y en la búsqueda, y llevar al creador a la pantalla del tema. Origen: HU-08 (CA-08.3).

#### Scenario: Crear tema público

- **WHEN** el usuario crea un tema con título "¿Pizza con piña?" y visibilidad pública
- **THEN** el sistema crea el tema, muestra al creador su pantalla y otro usuario lo encuentra al buscar "piña"

### Requirement: Imagen adjunta opcional

El sistema SHALL permitir adjuntar opcionalmente una imagen JPEG, PNG o WebP de hasta 5 MB, que se mostrará en la pantalla del tema, y SHALL rechazar archivos de otro tipo o de mayor tamaño sin crear el tema. El tipo SHALL verificarse por el contenido del archivo y no solo por su extensión. Origen: HU-09 (CA-09.1–CA-09.3).

#### Scenario: Tema con imagen

- **WHEN** el usuario crea un tema adjuntando una imagen PNG de 1 MB
- **THEN** el tema se crea con la imagen y esta aparece en la mitad superior de la pantalla del tema

#### Scenario: Tema sin imagen

- **WHEN** el usuario crea un tema sin adjuntar imagen
- **THEN** el tema se crea sin imagen

#### Scenario: Imagen demasiado grande

- **WHEN** el usuario adjunta una imagen de 6 MB
- **THEN** el sistema rechaza la creación indicando el tamaño máximo y no crea el tema

#### Scenario: Archivo con tipo no permitido

- **WHEN** el usuario adjunta un PDF renombrado como `foto.jpg`
- **THEN** el sistema rechaza la creación indicando los formatos permitidos y no crea el tema

### Requirement: Creación de un tema privado

El sistema SHALL permitir marcar el tema como privado; un tema privado SHALL NOT aparecer en la lista de tendencias ni en la búsqueda, y su creador SHALL poder acceder a él tras crearlo. Origen: HU-10 (CA-10.1–CA-10.3).

#### Scenario: Crear tema privado

- **WHEN** el usuario crea un tema con visibilidad privada
- **THEN** el sistema crea el tema, lleva al creador a su pantalla y el tema no aparece en tendencias ni en búsquedas de ningún usuario
