## Context

Hoy hay dos canalizaciones paralelas: el workflow `CI` (job `ci`: instalar, migrar, lint, typecheck, tests, build, e2e) y la integración Git de Vercel, que construye con `npm run vercel-build` (migra solo en producción) y publica al recibir el `push`. Una no espera a la otra. La APK se genera a mano con `npm run build:mobile` y Gradle (JDK 21, `compileSdk` 36). La aplicación se ejecuta en Vercel; `docker-compose.yml` solo levanta PostgreSQL y MinIO. `src/server/env.ts` valida las variables al importarse, así que `next build` las necesita.

## Goals / Non-Goals

**Goals:**
- Que nada llegue a `main`, y por tanto a producción, sin pasar por una PR con el CI en verde.
- Que la APK de depuración salga del CI, descargable.
- Que `docker compose --profile app up` arranque la aplicación completa en local.
- Que todo sea reproducible desde el repositorio, sin secretos dentro.

**Non-Goals:**
- Hacer que Vercel espere de forma explícita al CI (job `deploy` con `needs: ci` o _Deployment Checks_): se descartó por ahora, ver la decisión 2.
- Publicar la APK en Google Play o firmarla con clave de producción (necesita un _keystore_ y secretos propios).
- Publicar la imagen Docker en un registro (GHCR) ni desplegar en Docker en producción: Vercel sigue siendo el destino.
- Exigir la aprobación de otra persona en las PR.

## Decisions

1. **Proteger `main` con un _ruleset_ de GitHub versionado en `.github/rulesets/main.json`.** Reglas: PR obligatoria, check requerido `ci`, sin `force push` ni borrado de la rama, rama actualizada antes de fusionar, **cero aprobaciones requeridas** (eres el único desarrollador y el CI es la puerta de calidad). El JSON se importa en _Settings → Rules → Rulesets → Import_.
   - *Alternativa:* _branch protection rules_ clásicas. Descartada: no se pueden versionar y los _rulesets_ son lo que GitHub recomienda ahora.
   - **Excepción para el propietario, solo a través de una PR** (`bypass_mode: pull_request`): en una urgencia puede fusionar una PR sin esperar al CI, pero **no** puede hacer un `push` directo a `main`. Es el término medio de tu decisión: mantiene la comodidad de la excepción y conserva rama, PR y trazabilidad. *Alternativa descartada:* bypass `always`, que permite `push` directo y reabre el hueco actual.
2. **Solo proteger `main`; Vercel sigue desplegando por su cuenta.** Como `main` solo recibe PR con el CI en verde, el código que Vercel despliega al fusionar ya está comprobado. No hay job de despliegue, ni `vercel.json`, ni secretos de Vercel en GitHub.
   - *Alternativa, job `deploy` con `needs: ci`:* publicar con la CLI de Vercel desde Actions y desactivar el despliegue automático de `main`. Más robusto, pero exige 3 secretos y mover el build y las migraciones al ejecutor de GitHub. Queda como mejora futura.
   - *Alternativa, _Deployment Checks_ de Vercel:* depende del plan y hay que comprobarlo.
   - **Hueco residual aceptado:** (a) una PR fusionada con la excepción del propietario sin esperar al CI se despliega igualmente; (b) si el CI falla sobre el commit de fusión, Vercel ya habrá desplegado. Ambos se documentan en `docs/12-ci-cd.md`.
3. **Un job `apk` en el mismo workflow**, con JDK 21 (Temurin), caché de Gradle, `npm run build:mobile` (que ya hace `next build` estático y `cap sync android`), `chmod +x android/gradlew` y `assembleDebug`. Sube `app-debug.apk` como artefacto de 14 días. Corre en PR y en `main`, **informativo**: no es un check requerido, porque tarda varios minutos y no debe bloquear cambios que no tocan la app.
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
- [Se pierde el `push` directo, que es más rápido] → Flujo de rama y PR documentado; con cero aprobaciones requeridas, fusionar tu propia PR en cuanto el CI pasa es inmediato.
- [La excepción del propietario puede usarse con el CI en rojo y Vercel desplegaría] → Se acepta y se documenta; la defensa es el hábito de no usarla salvo urgencia. Si se quiere cerrar del todo, se añade el job `deploy`.
- [La imagen standalone puede perder ficheros que Prisma necesita (motores, esquema)] → Copiarlos explícitamente en la etapa final y cubrirlo con la prueba de humo.
- [El job `apk` puede fallar por la plataforma de Android (`compileSdk` 36) no instalada en el ejecutor] → Instalar la plataforma con `sdkmanager` si hace falta; se comprobará en la primera ejecución.
- [`gradlew` sin permiso de ejecución al venir de Windows] → `chmod +x` en el workflow y `.gitattributes` con `eol=lf` para `gradlew` y el entrypoint.

## Migration Plan

1. Comprobar que el CI actual pasa en GitHub (es el requisito de todo lo demás).
2. Añadir los jobs `apk` y `docker` y arreglar lo que salga; después importar el _ruleset_ exigiendo `ci`.
3. Probar el flujo con una PR de prueba: CI en rojo no deja fusionar, en verde sí, y `push` directo se rechaza.
4. Rollback: borrar o desactivar el _ruleset_ en GitHub; los jobs `apk` y `docker` son inocuos y se pueden quitar del workflow.

## Open Questions

Resueltas el 8 de noviembre de 2026:
- ~~¿Excepción para el propietario?~~ **Sí, solo a través de una PR** (nunca `push` directo).
- ~~¿Cómo espera Vercel al CI?~~ **Solo se protege `main`**; no hay job `deploy` por ahora.
- ~~¿`apk` es un check requerido?~~ **No, informativo.**
- ~~¿Revisión obligatoria de otra persona?~~ **No, basta el CI.**

Siguen abiertas, sin urgencia:
- ¿Se publicará la imagen Docker en GHCR más adelante?
- ¿Se cerrará el hueco residual con el job `deploy` (necesita 3 secretos en GitHub) o con _Deployment Checks_, si el plan de Vercel lo permite?
