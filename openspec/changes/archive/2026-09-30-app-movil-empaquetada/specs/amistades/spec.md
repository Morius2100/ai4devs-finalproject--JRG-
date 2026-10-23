## MODIFIED Requirements

### Requirement: Propio perfil sin check

El sistema SHALL NOT permitir que un usuario sea amigo de sí mismo. En su propio perfil, al que puede llegar por URL, SHALL NOT mostrar el botón de amistad y SHALL mostrar todos sus temas, incluidos los privados. La API SHALL responder `400` a `PUT` y a `DELETE` sobre `/api/users/{propio-id}/friendship`. Origen: HU-15 (CA-15.4).

#### Scenario: Abrir el propio perfil

- **WHEN** "ana" abre `/persona?id={id-de-ana}`
- **THEN** ve su cabecera y todos sus temas, sin botón de amistad

#### Scenario: Intento de auto-amistad por API

- **WHEN** "ana" envía `PUT /api/users/{id-de-ana}/friendship`
- **THEN** el sistema responde `400` y no crea ninguna fila
