## Why

[`docs/12-ci-cd.md`](../../../docs/12-ci-cd.md) §12.5 lista los huecos que dejó la Revisión 1 (tarea T10): el despliegue de Vercel **no espera al CI** (el 8 de noviembre se publicó en producción con el CI en rojo), se trabaja con `push` directo a `main`, la APK se compila a mano y la aplicación no tiene contenedor. Este cambio cierra los tres: una `main` protegida, un despliegue que solo ocurre tras un CI en verde, una APK construida por el CI y un `Dockerfile` para reproducir la aplicación completa.

## What Changes

- **Rama `main` protegida**: pull request obligatoria, check `ci` requerido y sin `force push`, definido como un _ruleset_ de GitHub versionado en el repositorio. Pasa a haber una rama y una PR por cambio.
- **Vercel espera al CI**: el despliegue de producción lo hace un job `deploy` del workflow con `needs: ci`, y Vercel deja de desplegar `main` por su cuenta. Las vistas previas por rama siguen siendo automáticas.
- **APK en el CI**: un job `apk` construye la APK de depuración (export estático + Capacitor + Gradle) y la sube como artefacto.
- **`Dockerfile` de la aplicación**: imagen multietapa, con usuario sin privilegios y `HEALTHCHECK`, más un servicio `app` opcional en `docker-compose.yml` y un job `docker` que comprueba que la imagen se construye.
- **Documentación**: se actualizan `docs/12-ci-cd.md` y `docs/08-despliegue-vercel.md`, y se añade una guía breve del flujo de trabajo con ramas y PR.

## Capabilities

### New Capabilities
- `proteccion-main`: `main` solo recibe cambios mediante PR con el CI en verde, y la producción solo se despliega tras ese CI.
- `apk-en-ci`: cada cambio relevante produce una APK de depuración descargable desde el CI.
- `contenedor-aplicacion`: la aplicación se construye y se ejecuta en un contenedor junto a sus servicios.

### Modified Capabilities
<!-- Ninguna en las specs principales. La capacidad `ci-cd` del cambio `documentar-ci-cd` (aún sin archivar) queda ampliada por este cambio; conviene archivar aquel primero. -->

## Impact

- **Archivos:** `.github/workflows/ci.yml` (jobs `deploy`, `apk`, `docker`), `.github/rulesets/main.json`, `vercel.json`, `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `next.config.ts` (salida `standalone` solo bajo una variable), `docs/`.
- **Ajustes fuera del repositorio, solo del propietario** (el cambio los deja documentados paso a paso): importar el _ruleset_ en GitHub y crear en GitHub los secretos `VERCEL_TOKEN`, `VERCEL_ORG_ID` y `VERCEL_PROJECT_ID`. Ninguna credencial se guarda en el repositorio.
- **Cambio de hábito:** ya no se puede hacer `push` directo a `main`; hace falta rama y PR.
- **Depende de** que el CI pase de verdad: el arreglo de `npm ci` está hecho pero su ejecución en GitHub aún no se ha comprobado (tarea 4.1 de `documentar-ci-cd`). Proteger `main` con un CI que no pasa bloquearía todo.
- **No cambia** el código de la aplicación ni la base de datos.
