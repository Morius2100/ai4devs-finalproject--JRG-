## ADDED Requirements

### Requirement: Cada criterio de aceptación tiene un test identificable
Cada criterio de aceptación (`CA-xx.y`) de `docs/04-historias-usuario.md` SHALL estar cubierto por al menos un test automático, o constar en `docs/10-trazabilidad-criterios.md` como no automatizable con su motivo. Los tests derivados de un criterio SHALL citar su identificador en el título. Origen: Revisión 1 de LIDR, tarea T9; HU-00 a HU-12.

#### Scenario: Buscar el test de un criterio
- **WHEN** se ejecuta `grep -rn "CA-07.3" tests`
- **THEN** aparece al menos un test cuyo título cita CA-07.3

#### Scenario: Criterio sin test automático
- **WHEN** un criterio no se puede probar de forma automática, como el contenido de la APK
- **THEN** consta en la tabla «Criterios sin test automático» con el motivo

### Requirement: Las pruebas no dependen de ejecuciones anteriores
Las pruebas unitarias y de integración SHALL pasar en ejecuciones consecutivas sin limpiar la base de datos a mano, y el límite de intentos SHALL estar desactivado por defecto en ellas, salvo en las que lo prueban. Origen: Revisión 1 de LIDR, tarea T9.

#### Scenario: Dos ejecuciones seguidas
- **WHEN** se ejecuta `npm test` dos veces seguidas
- **THEN** ambas terminan sin fallos
