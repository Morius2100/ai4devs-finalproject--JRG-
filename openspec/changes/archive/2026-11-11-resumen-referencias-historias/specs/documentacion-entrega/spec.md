## ADDED Requirements

### Requirement: Las historias de usuario del README son autocontenidas
Cada historia de usuario del §5 del `readme.md` de entrega (HU-01, HU-04/HU-05 y HU-12) MUST incluir, junto a la línea de tickets y spec, una única línea de resumen. Esa línea explica qué cubre cada ticket referenciado y qué fija la spec asociada, sin que el lector tenga que abrirlos. Origen: Revisión 1 de LIDR, tarea T4. Afecta a la documentación de HU-01, HU-04, HU-05 y HU-12.

#### Scenario: Resumen de HU-01
- **WHEN** el revisor lee HU-01 en el §5
- **THEN** ve una línea que explica qué aportan TKT-011, TKT-012, TKT-013 y TKT-015 y qué fija la spec `descubrimiento-temas`

#### Scenario: Resumen de HU-04/HU-05
- **WHEN** el revisor lee HU-04/HU-05 en el §5
- **THEN** ve una línea que explica qué aportan TKT-019, TKT-021 y TKT-023 y qué fija la spec `votacion`

#### Scenario: Resumen de HU-12
- **WHEN** el revisor lee HU-12 en el §5
- **THEN** ve una línea que explica qué aportan TKT-029, TKT-030, TKT-031 y TKT-032 y qué fija la spec `notificaciones`

#### Scenario: Coherencia con la fuente
- **WHEN** se compara cada resumen con el título y el objetivo del ticket en `docs/05-tickets.md`
- **THEN** no hay contradicciones
