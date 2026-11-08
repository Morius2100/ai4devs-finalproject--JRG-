## Why

[`docs/12-ci-cd.md`](../../../docs/12-ci-cd.md) §12.5 lista los huecos que dejó la Revisión 1 (tarea T10): el despliegue de Vercel **no espera al CI** (el 8 de noviembre se publicó en producción con el CI en rojo), se trabaja con `push` directo a `main`, la APK se compila a mano y la aplicación no tiene contenedor. Este cambio cierra los tres: una `main` protegida, una APK construida por el CI y un `Dockerfile` para reproducir la aplicación completa.

## What Changes

- **Rama `main` protegida**: pull request obligatoria, check `ci` requerido y sin `force push`, definido como un _ruleset_ de GitHub versionado en el repositorio. El propietario puede saltarse los requisitos **solo a través de una PR** (urgencias), nunca con un `push` directo. No se exige la aprobación de otra persona. Pasa a haber una rama y una PR por cambio.
- **Producción solo con lo que pasó el CI**: como `main` únicamente recibe PR con el CI en verde, lo que Vercel despliega al fusionar ya está comprobado. Vercel sigue desplegando por su cuenta y las vistas previas no cambian: **no hay job de despliegue ni secretos nuevos**. El hueco que queda (una PR fusionada saltándose el CI) se documenta.
- **APK en el CI**: un job `apk`, informativo (no bloquea la fusión), construye la APK de depuración (export estático + Capacitor + Gradle) y la sube como artefacto.
- **`Dockerfile` de la aplicación**: imagen multietapa, con usuario sin privilegios y `HEALTHCHECK`, más un servicio `app` opcional en `docker-compose.yml` y un job `docker` que comprueba que la imagen se construye.
- **Documentación**: se actualizan `docs/12-ci-cd.md` y `docs/08-despliegue-vercel.md`, y se documenta el flujo de trabajo con ramas y PR.

## Capabilities

### New Capabilities
- `proteccion-main`: `main` solo recibe cambios mediante PR con el CI en verde, de modo que la producción solo despliega código comprobado.
- `apk-en-ci`: cada cambio relevante produce una APK de depuración descargable desde el CI.
- `contenedor-aplicacion`: la aplicación se construye y se ejecuta en un contenedor junto a sus servicios.

### Modified Capabilities
<!-- Ninguna en las specs principales. La capacidad `ci-cd` del cambio `documentar-ci-cd` (aún sin archivar) queda ampliada por este cambio; conviene archivar aquel primero. -->

## Impact

- **Archivos:** `.github/workflows/ci.yml` (jobs `apk` y `docker`), `.github/rulesets/main.json`, `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `.gitattributes`, `next.config.ts` (salida `standalone` solo bajo una variable), `docs/`.
- **Ajuste fuera del repositorio, solo del propietario** (queda documentado paso a paso): importar el _ruleset_ en GitHub. No hace falta ningún secreto ni tocar la configuración de Vercel.
- **Cambio de hábito:** ya no se puede hacer `push` directo a `main`; hace falta rama y PR.
- **Depende de** que el CI pase de verdad: el arreglo de `npm ci` está hecho pero su ejecución en GitHub aún no se ha comprobado (tarea 4.1 de `documentar-ci-cd`). Proteger `main` con un CI que no pasa bloquearía todo.
- **Hueco que se acepta:** Vercel sigue sin esperar de forma explícita al CI. Si el propietario fusiona una PR saltándose el CI, o el CI falla sobre el commit de fusión, el despliegue ocurre igualmente. El job `deploy` con `needs: ci` queda como mejora futura.
- **No cambia** el código de la aplicación ni la base de datos.
