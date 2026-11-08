## Context

Hoy hay dos canalizaciones paralelas: el workflow `CI` (job `ci`: instalar, migrar, lint, typecheck, tests, build, e2e) y la integración Git de Vercel, que construye con `npm run vercel-build` (migra solo en producción) y publica al recibir el `push`. Una no espera a la otra. La APK se genera a mano con `npm run build:mobile` y Gradle (JDK 21, `compileSdk` 36). La aplicación se ejecuta en Vercel; `docker-compose.yml` solo levanta PostgreSQL y MinIO. `src/server/env.ts` valida las variables al importarse, así que `next build` las necesita.

## Goals / Non-Goals

**Goals:**
- Que nada llegue a `main` ni a producción sin el CI en verde.
- Que la APK de depuración salga del CI, descargable.
- Que `docker compose --profile app up` arranque la aplicación completa en local.
- Que todo sea reproducible desde el repositorio, sin secretos dentro.

**Non-Goals:**
- Publicar la APK en Google Play o firmarla con clave de producción (necesita un _keystore_ y secretos propios).
- Publicar la imagen Docker en un registro (GHCR) ni desplegar en Docker en producción: Vercel sigue siendo el destino.
- Cambiar de plataforma de despliegue.

## Decisions

1. **Proteger `main` con un _ruleset_ de GitHub versionado en `.github/rulesets/main.json`.** Reglas: PR obligatoria, check requerido `ci`, sin `force push` ni borrado de la rama, rama actualizada antes de fusionar. El JSON se importa en _Settings → Rules → Rulesets → Import_, así queda reproducible y revisable.
   - *Alternativa:* _branch protection rules_ clásicas. Descartada: no se pueden versionar y los _rulesets_ son lo que GitHub recomienda ahora.
   - **Sin excepción para el propietario**, porque una protección que se puede saltar con un `push` no habría evitado el despliegue con el CI en rojo. Si hay una urgencia, se hace una PR y se espera al CI.
2. **El despliegue de producción lo hace un job `deploy` con `needs: ci`, no Vercel por su cuenta.** Con la CLI de Vercel: `vercel pull`, `vercel build --prod` y `vercel deploy --prebuilt --prod`. `vercel.json` desactiva el despliegue automático de `main` (`git.deploymentEnabled.main = false`) para que no haya dos caminos; las ramas y PR conservan sus vistas previas.
   - *Alternativa A, solo proteger `main`:* como todo lo que llega a `main` ya pasó el CI en su PR, Vercel desplegaría un código ya comprobado. Es la mitad del trabajo y no necesita secretos, pero deja un hueco (un fallo del CI sobre el commit de fusión no detiene el despliegue) y no hace que Vercel «espere» de forma explícita.
   - *Alternativa B, _Deployment Checks_ de Vercel:* depende del plan de Vercel y hay que comprobarlo antes de adoptarla.
   - **Se hace A primero y el job `deploy` después**, en dos fases, para que la protección útil llegue sin tener que crear secretos.
   - **Riesgo asumido:** `vercel build` corre en el ejecutor de GitHub y ejecuta `prisma migrate deploy` contra Neon con las variables que baja `vercel pull`. Ya pasaba en el build de Vercel; ahora ocurre en Actions. Se usa `concurrency` para que no haya dos despliegues a la vez.
3. **Un job `apk` en el mismo workflow**, con JDK 21 (Temurin), caché de Gradle, `npm run build:mobile` (que ya hace `next build` estático y `cap sync android`), `chmod +x android/gradlew` y `assembleDebug`. Sube `app-debug.apk` como artefacto de 14 días. Corre en PR y en `main`, pero **no es un check requerido** al principio: tarda varios minutos y no debe bloquear cambios que no tocan la app.
   - La APK de depuración está firmada con la clave de depuración y se instala directamente; la de _release_ queda fuera.
4. **`Dockerfile` multietapa sobre `node:22-bookworm-slim`**: `deps` (`npm ci`), `build` (`prisma generate` y `next build` con la salida `standalone`) y `runner` (solo la salida mínima, el esquema y las migraciones de Prisma, usuario `node`, `HEALTHCHECK` sobre `/api/health`). Debian en lugar de Alpine para evitar problemas con los motores de Prisma.
   - `next.config.ts` activa `output: "standalone"` **solo si** `NEXT_OUTPUT=standalone`, para no alterar Vercel ni el export de la APK.
   - `env.ts` exige las variables al compilar: el `build` recibe valores de relleno (`ARG`), nunca secretos; el contenedor recibe los reales en tiempo de ejecución.
   - El arranque ejecuta `prisma migrate deploy` y luego `node server.js`, como en Vercel.
   - En un contenedor `NODE_ENV` es `production` y no hay `VERCEL`, así que `trustHost` exige `AUTH_TRUST_HOST=true` (o `AUTH_URL`): el servicio lo define.
5. **El servicio `app` va en un _profile_ de Compose** (`--profile app`), de modo que `docker compose up -d` siga arrancando solo PostgreSQL y MinIO como hasta ahora.
6. **Un job `docker` en el CI** construye la imagen (sin publicarla) para que un `Dockerfile` roto no pase desapercibido. Se plantea una prueba de humo (arrancar con Compose y pedir `/api/health`) como paso opcional.

## Risks / Trade-offs

- [Proteger `main` con un CI que no ha pasado nunca bloquea todo] → Orden obligatorio: primero comprobar el CI en GitHub (tarea 4.1 de `documentar-ci-cd`) y solo después importar el _ruleset_.
- [Se pierde el `push` directo, que es más rápido] → Flujo de rama y PR documentado en una guía corta; el CI da la confianza para fusionar sin revisión manual.
- [`vercel pull` y `vercel build` exponen variables de producción al ejecutor] → Se guardan solo como secretos de GitHub; el job usa un _environment_ `production` (con revisores opcionales); no se imprimen en el log.
- [Si el job `deploy` falla a mitad, la base de datos puede quedar migrada con el código anterior en producción] → Las migraciones son aditivas y compatibles con la versión anterior (regla ya existente).
- [La imagen standalone puede perder ficheros que Prisma necesita (motores, esquema)] → Copiarlos explícitamente en la etapa final y cubrirlo con la prueba de humo.
- [El job `apk` puede fallar por la plataforma de Android (`compileSdk` 36) no instalada en el ejecutor] → Instalar la plataforma con `sdkmanager` si hace falta; se comprobará en la primera ejecución.
- [`gradlew` sin permiso de ejecución al venir de Windows] → `chmod +x` en el workflow y `.gitattributes` con `eol=lf` para `gradlew` y el entrypoint.

## Migration Plan

1. Comprobar que el CI actual pasa en GitHub (es el requisito de todo lo demás).
2. Añadir los jobs `apk` y `docker` y arreglar lo que salga; después importar el _ruleset_ exigiendo `ci`.
3. Crear los secretos de Vercel, añadir el job `deploy` y desactivar el despliegue automático de `main`.
4. Rollback de cualquiera de los pasos: eliminar el _ruleset_ en GitHub, o quitar `git.deploymentEnabled` de `vercel.json` para que Vercel vuelva a desplegar `main` por sí mismo.

## Open Questions

- ¿Se admite una excepción para el propietario en el _ruleset_ (para urgencias) o se prefiere sin excepción?
- ¿Se quiere revisión obligatoria de la PR por otra persona? Con un solo desarrollador, probablemente no.
- ¿El job `apk` debe ser un check requerido, o solo informativo?
- ¿Se publicará la imagen Docker en GHCR más adelante?
- ¿El plan de Vercel permite _Deployment Checks_? Solo importa si se prefiere esa vía al job `deploy`.
