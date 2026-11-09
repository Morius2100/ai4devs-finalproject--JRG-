# ci-cd Specification

## Purpose
TBD - created by archiving change documentar-ci-cd. Update Purpose after archive.
## Requirements
### Requirement: El flujo de CI/CD está documentado con un diagrama fiel
La documentación del proyecto SHALL incluir un diagrama de la canalización de CI/CD que muestre los pasos del CI, los del despliegue, los entornos y la relación entre ambas canalizaciones, y SHALL indicar los huecos conocidos. El diagrama MUST describir lo que existe en el repositorio. Origen: Revisión 1 de LIDR, tarea T10.

#### Scenario: El revisor busca el diagrama
- **WHEN** abre `docs/12-ci-cd.md`
- **THEN** ve un diagrama de la canalización completa y otro del workflow de CI, ambos en Mermaid y válidos

#### Scenario: Los huecos constan
- **WHEN** el despliegue no espera al CI
- **THEN** el diagrama lo indica y la sección «Lo que falta» propone cómo cerrarlo

### Requirement: El CI instala las dependencias
El workflow de CI SHALL poder ejecutar `npm ci` con la versión de npm que incluye su versión de Node. El lock `package-lock.json` MUST ser compatible con npm 10 y npm 11. Origen: Revisión 1 de LIDR, tarea T10.

#### Scenario: Instalación con npm 10
- **WHEN** se ejecuta `npx -y npm@10 ci --dry-run`
- **THEN** termina sin errores

#### Scenario: Instalación con npm 11
- **WHEN** se ejecuta `npm ci --dry-run`
- **THEN** termina sin errores

### Requirement: El CI no depende de servicios que no levanta
El workflow de CI SHALL definir `IMAGE_STORAGE=memory` mientras no levante MinIO, para que las pruebas con imágenes no intenten conectar con un almacenamiento ausente. Origen: Revisión 1 de LIDR, tarea T10.

#### Scenario: Pruebas con imágenes en CI
- **WHEN** el CI ejecuta las pruebas de integración y los e2e que suben imágenes
- **THEN** las imágenes se guardan en memoria

