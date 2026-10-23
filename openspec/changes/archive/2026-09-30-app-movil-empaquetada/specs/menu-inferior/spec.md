## MODIFIED Requirements

### Requirement: Pestaña activa según la sección

El sistema SHALL marcar como activa la pestaña "Personas" en `/personas` y en cualquier perfil (`/persona`), y la pestaña "Temas" en `/` y en `/temas/nuevo`. La pestaña activa SHALL exponerse a tecnologías de asistencia con `aria-current="page"`. Origen: HU-13 (CA-13.1).

#### Scenario: Perfil dentro de Personas

- **WHEN** el usuario abre el perfil de otra persona
- **THEN** la pestaña "Personas" aparece activa y tiene `aria-current="page"`

#### Scenario: Crear tema dentro de Temas

- **WHEN** el usuario abre `/temas/nuevo`
- **THEN** la pestaña "Temas" aparece activa
