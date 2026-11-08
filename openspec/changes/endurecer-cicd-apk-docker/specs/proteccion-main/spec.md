## ADDED Requirements

### Requirement: La rama main solo recibe cambios mediante pull request con el CI en verde
El repositorio SHALL tener un _ruleset_ de GitHub, versionado en `.github/rulesets/main.json`, que exija pull request para cambiar `main`, el check `ci` en verde, y prohíba el `force push` y el borrado de la rama. El _ruleset_ SHALL NOT exigir la aprobación de otra persona. El propietario del repositorio PUEDE saltarse los requisitos únicamente a través de una pull request (`bypass_mode: pull_request`); nadie MUST poder hacer `push` directo a `main`. Origen: Revisión 1 de LIDR, tarea T10.

#### Scenario: Push directo rechazado, también al propietario
- **WHEN** cualquiera, incluido el propietario, intenta hacer `git push origin main` con un commit nuevo
- **THEN** GitHub rechaza el push y pide una pull request

#### Scenario: PR con el CI en rojo
- **WHEN** el check `ci` de una pull request falla y quien la fusiona no es el propietario con excepción
- **THEN** GitHub no permite fusionarla

#### Scenario: PR con el CI en verde
- **WHEN** el check `ci` pasa
- **THEN** la pull request se puede fusionar en `main` sin necesidad de aprobación de otra persona

#### Scenario: Excepción del propietario en una urgencia
- **WHEN** el propietario fusiona una pull request saltándose el check `ci`
- **THEN** la fusión queda registrada en la pull request y no se ha hecho ningún push directo a `main`

### Requirement: La producción despliega código que pasó por la PR
Lo que Vercel despliega en producción SHALL ser siempre el resultado de fusionar una pull request en `main`, de modo que, salvo la excepción del propietario, ya ha pasado el CI. Vercel SHALL seguir creando las vistas previas de ramas y pull requests. No MUST haber en el repositorio ninguna credencial de Vercel. Origen: Revisión 1 de LIDR, tarea T10.

#### Scenario: Fusión normal
- **WHEN** se fusiona una pull request con el CI en verde
- **THEN** Vercel despliega `main` en producción y `/api/health` responde `200`

#### Scenario: Cambio sin pull request
- **WHEN** se intenta llegar a producción sin una pull request
- **THEN** no es posible, porque `main` rechaza el push directo

#### Scenario: Vista previa de una rama
- **WHEN** se hace `push` a una rama que no es `main`
- **THEN** Vercel crea la vista previa

#### Scenario: Sin secretos en el repositorio
- **WHEN** se buscan tokens en los ficheros versionados
- **THEN** no aparece ningún token de Vercel

### Requirement: El hueco residual está documentado
La documentación SHALL indicar que Vercel no espera de forma explícita al CI y que una fusión con la excepción del propietario, o un CI que falle sobre el commit de fusión, desplegará igualmente, y SHALL proponer cómo cerrarlo. Origen: Revisión 1 de LIDR, tarea T10.

#### Scenario: Quien lee la guía
- **WHEN** abre `docs/12-ci-cd.md`
- **THEN** ve el flujo de rama y PR, los pasos para importar el _ruleset_, cómo deshacerlo y el hueco residual con la mejora propuesta
