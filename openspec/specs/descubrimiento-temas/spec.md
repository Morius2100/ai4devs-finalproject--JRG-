## Purpose

Descubrimiento e implementación de la pantalla principal de Opina: lista de temas públicos ordenados por tendencia (votos), búsqueda de temas por título, y scroll infinito con paginación keyset. Es la puerta de entrada al sistema y permite a usuarios registrados explorar y votar sobre temas. Origen: HU-01 y HU-02 de la definición del producto.

## Requirements

### Requirement: Lista de tendencias en la pantalla principal

El sistema SHALL mostrar en la pantalla principal, mientras no haya búsqueda activa, una lista de temas públicos ordenados por número total de votos descendente y, a igualdad de votos, del más reciente al más antiguo. Cada elemento SHALL mostrar el título del tema. Origen: HU-01 (CA-01.1, CA-01.2).

#### Scenario: Orden por tendencia

- **WHEN** el usuario entra en la pantalla principal sin buscar nada y existen los temas públicos A (10 votos), B (25 votos) y C (10 votos, más reciente que A)
- **THEN** la lista muestra los temas en el orden B, C, A con su título

#### Scenario: Sin temas

- **WHEN** el usuario entra en la pantalla principal y no existe ningún tema público
- **THEN** el sistema muestra un estado vacío indicando que no hay temas

### Requirement: Lista scrolleable con carga continua

El sistema SHALL presentar los temas en una lista scrolleable que carga páginas de 20 temas conforme el usuario se acerca al final. Origen: HU-01 (CA-01.3), HU-02 (CA-02.5).

#### Scenario: Cargar más temas al hacer scroll

- **WHEN** existen 45 temas públicos y el usuario hace scroll hasta el final de la lista
- **THEN** el sistema añade los siguientes 20 temas sin repetir ninguno, y tras el siguiente scroll los 5 restantes

#### Scenario: Fin de la lista

- **WHEN** el usuario ha cargado todos los temas disponibles
- **THEN** el sistema no realiza más peticiones de carga

### Requirement: Exclusión de temas privados en los listados

El sistema SHALL mostrar únicamente temas públicos en la lista de tendencias y en los resultados de búsqueda. Origen: HU-01 (CA-01.4), supuesto S-06.

#### Scenario: Tema privado no listado

- **WHEN** existe un tema privado con más votos que cualquier tema público
- **THEN** ese tema no aparece ni en las tendencias ni en ninguna búsqueda, aunque su título coincida

### Requirement: Buscador de temas

El sistema SHALL mostrar un buscador en la parte superior de la pantalla principal que filtre los temas públicos cuyo título contenga el texto introducido, sin distinguir mayúsculas y minúsculas, manteniendo el orden por tendencia. Origen: HU-02 (CA-02.1, CA-02.2).

#### Scenario: Buscar por parte del título

- **WHEN** el usuario escribe "pizza" y existen los temas públicos "¿Pizza con piña?" y "La mejor PIZZERIA" y "Tortilla con cebolla"
- **THEN** la lista muestra solo "¿Pizza con piña?" y "La mejor PIZZERIA"

#### Scenario: Caracteres especiales en la búsqueda

- **WHEN** el usuario busca "100%"
- **THEN** el sistema trata `%` como carácter literal y solo muestra temas cuyo título contiene "100%"

### Requirement: Volver a las tendencias al vaciar la búsqueda

El sistema SHALL volver a mostrar las tendencias cuando el buscador queda vacío. Origen: HU-02 (CA-02.3).

#### Scenario: Borrar el texto de búsqueda

- **WHEN** el usuario tiene una búsqueda activa y borra todo el texto del buscador
- **THEN** la lista vuelve a mostrar las tendencias

### Requirement: Búsqueda sin resultados

El sistema SHALL indicar que no hay resultados cuando ningún tema público coincide con la búsqueda. Origen: HU-02 (CA-02.4).

#### Scenario: Ninguna coincidencia

- **WHEN** el usuario busca un texto que no aparece en ningún título de tema público
- **THEN** el sistema muestra un mensaje de "sin resultados"

### Requirement: Navegación a un tema desde la lista

El sistema SHALL abrir la pantalla de un tema cuando el usuario pulsa sobre él en la lista. Origen: HU-01 (CA-01.6).

#### Scenario: Pulsar un tema

- **WHEN** el usuario pulsa un tema de la lista de tendencias o de resultados
- **THEN** el sistema navega a la pantalla de ese tema
