## ADDED Requirements

### Requirement: La documentación citada es accesible desde el repositorio de entrega
El repositorio de entrega MUST contener los directorios `docs/` y `openspec/` con la documentación técnica y el plan SDD que cita el `readme.md`. También MUST incluir una nota de procedencia que indique el repositorio, la rama y el commit de origen. Origen: Revisión 1 de LIDR, tarea T2. No deriva de ninguna HU, porque es un requisito de la entrega.

#### Scenario: El revisor busca la documentación técnica
- **WHEN** el revisor abre el repositorio de entrega en la rama de entrega
- **THEN** encuentra `docs/` con los documentos 01 a 08 y `mockups/`, y `openspec/` con `config.yaml`, `specs/` y `changes/`

#### Scenario: Toda ruta citada existe
- **WHEN** se recorre cada ruta `docs/…` u `openspec/…` mencionada en el `readme.md`
- **THEN** cada ruta existe en el repositorio de entrega

#### Scenario: La procedencia está documentada
- **WHEN** el revisor abre `docs/README.md`
- **THEN** ve el repositorio, la rama y el hash del commit del que se copió la documentación

#### Scenario: No se publican ficheros ajenos a la documentación
- **WHEN** se lista el contenido copiado
- **THEN** no hay ficheros `.env`, código fuente de la aplicación ni `docs/Revision1.txt`
