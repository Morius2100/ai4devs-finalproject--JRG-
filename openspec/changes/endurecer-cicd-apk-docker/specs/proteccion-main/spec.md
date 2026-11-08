## ADDED Requirements

### Requirement: La rama main solo recibe cambios mediante pull request con el CI en verde
El repositorio SHALL tener un _ruleset_ de GitHub, versionado en `.github/rulesets/main.json`, que exija pull request para cambiar `main`, el check `ci` en verde, y prohíba el `force push` y el borrado de la rama. El _ruleset_ MUST NOT admitir una excepción para el propietario. Origen: Revisión 1 de LIDR, tarea T10.

#### Scenario: Push directo rechazado
- **WHEN** alguien intenta hacer `git push origin main` con un commit nuevo
- **THEN** GitHub rechaza el push y pide una pull request

#### Scenario: PR con el CI en rojo
- **WHEN** el check `ci` de una pull request falla
- **THEN** GitHub no permite fusionarla

#### Scenario: PR con el CI en verde
- **WHEN** el check `ci` pasa
- **THEN** la pull request se puede fusionar en `main`

### Requirement: La producción solo se despliega tras un CI en verde
El despliegue de producción SHALL ejecutarlo un job `deploy` del workflow con `needs: ci`, solo en el evento `push` a `main`. Vercel SHALL NOT desplegar `main` por su cuenta (`vercel.json` lo desactiva), y SHALL seguir creando las vistas previas de ramas y pull requests. Ninguna credencial MUST guardarse en el repositorio: el job usa secretos de GitHub. Origen: Revisión 1 de LIDR, tarea T10.

#### Scenario: CI en rojo en main
- **WHEN** el job `ci` falla en un `push` a `main`
- **THEN** el job `deploy` no se ejecuta y la versión anterior sigue en producción

#### Scenario: CI en verde en main
- **WHEN** el job `ci` pasa en un `push` a `main`
- **THEN** el job `deploy` publica en producción

#### Scenario: Vista previa de una rama
- **WHEN** se hace `push` a una rama que no es `main`
- **THEN** Vercel crea la vista previa sin pasar por el job `deploy`

#### Scenario: Sin secretos en el repositorio
- **WHEN** se buscan tokens en los ficheros versionados
- **THEN** `VERCEL_TOKEN`, `VERCEL_ORG_ID` y `VERCEL_PROJECT_ID` solo aparecen como referencias `secrets.*`

### Requirement: El flujo de trabajo está documentado
La documentación SHALL describir el flujo de rama y pull request, cómo importar el _ruleset_, qué secretos crear y cómo deshacer cada paso. Origen: Revisión 1 de LIDR, tarea T10.

#### Scenario: Quien llega nuevo
- **WHEN** abre `docs/12-ci-cd.md`
- **THEN** encuentra el flujo de rama y PR, los pasos de configuración y el rollback
