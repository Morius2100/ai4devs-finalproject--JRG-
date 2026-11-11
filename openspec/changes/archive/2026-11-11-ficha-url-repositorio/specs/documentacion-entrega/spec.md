## ADDED Requirements

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
