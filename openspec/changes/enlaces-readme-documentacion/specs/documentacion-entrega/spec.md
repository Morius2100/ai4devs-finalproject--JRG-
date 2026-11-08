## ADDED Requirements

### Requirement: Las referencias del README son enlaces válidos
Toda mención en el `readme.md` del repositorio de entrega a un fichero o directorio de `docs/`, de `openspec/` o del código fuera de bloques de código MUST ser un enlace Markdown que resuelva a un recurso existente. El README MUST NOT contener marcadores de plantilla como `<URL_DEL_REPOSITORIO>`. Origen: Revisión 1 de LIDR, tarea T3. No deriva de ninguna HU, porque es un requisito de la entrega.

#### Scenario: Enlace a documentación técnica
- **WHEN** el revisor pulsa la referencia a `docs/06-stack.md` del §1.4
- **THEN** GitHub abre ese documento dentro del repositorio de entrega

#### Scenario: Enlace a código
- **WHEN** el revisor pulsa una referencia a `src/server/services` del §2.3
- **THEN** GitHub abre ese directorio en el repositorio de código

#### Scenario: Instalación sin marcadores
- **WHEN** el revisor copia el comando `git clone` del §1.4
- **THEN** el comando contiene la URL real del repositorio de código y funciona sin editarlo

#### Scenario: Comprobación automática de enlaces
- **WHEN** se ejecuta un comprobador de enlaces Markdown sobre `readme.md`
- **THEN** no informa de ningún enlace roto
