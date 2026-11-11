# documentacion-entrega Specification

## Purpose
Requisitos del `readme.md` del repositorio de entrega (ficha, enlaces y resúmenes de historias). Son exigencias de la entrega del máster, no del producto. Origen: Revisión 1 de LIDR.

## Requirements
### Requirement: La ficha del proyecto incluye la URL del repositorio
El apartado 0.5 del `readme.md` del repositorio de entrega MUST contener un enlace válido al repositorio de entrega y un enlace válido al repositorio con el código completo del proyecto. Además, MUST NOT contener marcadores «PENDIENTE». Origen: Revisión 1 de LIDR, tarea T1. No deriva de ninguna HU, porque es un requisito de la entrega, no del producto.

#### Scenario: El revisor abre la ficha
- **WHEN** el revisor lee el apartado 0.5 del `readme.md`
- **THEN** ve un enlace a `https://github.com/Morius2100/AI4Devs-finalproject` en la rama de entrega y un enlace a `https://github.com/Morius2100/ai4devs-finalproject--JRG-`, cada uno con una frase que dice qué contiene

#### Scenario: No quedan marcadores pendientes en el apartado 0.5
- **WHEN** se busca el texto «PENDIENTE» en el apartado 0.5
- **THEN** no hay ninguna coincidencia

#### Scenario: Los enlaces responden
- **WHEN** se abre cada URL del apartado 0.5 sin sesión iniciada en GitHub
- **THEN** la respuesta es HTTP 200

### Requirement: La ficha del proyecto incluye la URL de la aplicación desplegada
El apartado 0.4 del `readme.md` del repositorio de entrega MUST contener la URL de la aplicación desplegada en Vercel, `https://ai4devs-finalproject-jrg.vercel.app/`, y MUST NOT contener un marcador «PENDIENTE». Origen: petición del usuario al aplicar el change, porque la app ya está desplegada. No deriva de ninguna HU.

#### Scenario: El revisor busca la demo
- **WHEN** el revisor lee el apartado 0.4 del `readme.md`
- **THEN** ve un enlace a `https://ai4devs-finalproject-jrg.vercel.app/` y una indicación de que puede registrarse con un usuario nuevo

#### Scenario: La aplicación responde
- **WHEN** se abre la URL del apartado 0.4
- **THEN** la respuesta final es HTTP 200 tras la redirección a la pantalla de acceso

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
