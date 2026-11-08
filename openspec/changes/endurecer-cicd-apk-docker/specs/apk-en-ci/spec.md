## ADDED Requirements

### Requirement: El CI construye la APK de depuración
El workflow SHALL incluir un job `apk` que construya la interfaz estática (`npm run build:mobile`), sincronice el proyecto de Android y genere la APK de depuración con Gradle, y SHALL subirla como artefacto descargable con una retención de 14 días. La APK MUST apuntar por defecto al servidor publicado en Vercel por HTTPS. Origen: Revisión 1 de LIDR, tarea T10; HU-16.

#### Scenario: Cambio en una pull request
- **WHEN** se abre una pull request
- **THEN** el job `apk` genera `app-debug.apk` y la deja como artefacto

#### Scenario: APK instalable
- **WHEN** se descarga el artefacto y se instala en un móvil Android
- **THEN** la app arranca y se conecta al servidor de producción

#### Scenario: Fallo de la compilación
- **WHEN** la compilación de Android falla
- **THEN** el job `apk` queda en rojo y no se sube ningún artefacto

### Requirement: La APK de depuración no bloquea los cambios que no la afectan
El job `apk` SHALL NOT ser un check requerido de `main` mientras tarde varios minutos, para no bloquear cambios ajenos a la aplicación móvil. Origen: Revisión 1 de LIDR, tarea T10.

#### Scenario: Cambio solo de documentación
- **WHEN** una pull request solo toca `docs/`
- **THEN** se puede fusionar con el CI en verde aunque `apk` no haya terminado
