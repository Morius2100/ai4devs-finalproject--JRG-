> Origen: **Revisión 1 de LIDR, tarea T10** y los huecos de `docs/12-ci-cd.md` §12.5. No hay ticket TKT. Decisiones del 8 de noviembre de 2026: excepción del propietario solo vía PR, solo proteger `main` (sin job `deploy`), `apk` informativo y sin revisión obligatoria. Las tareas marcadas **(manual)** las hace el propietario en GitHub con sus credenciales. **Orden obligatorio:** el grupo 1 antes que el 2.

## 1. Antes de nada: un CI que pasa

- [ ] 1.1 Hacer push y comprobar en GitHub que el CI pasa `npm ci` y llega al final; corregir lo que falle (cierra la tarea 4.1 de `documentar-ci-cd`) (T10)
- [ ] 1.2 Archivar `documentar-ci-cd` para que su capacidad `ci-cd` pase a las specs principales (T10)

## 2. Rama main protegida

- [ ] 2.1 Crear `.github/rulesets/main.json`: PR obligatoria, check requerido `ci`, sin `force push` ni borrado, rama actualizada, cero aprobaciones, excepción del propietario con `bypass_mode: pull_request` (T10)
- [ ] 2.2 **(manual)** Importar el _ruleset_ en _Settings → Rules → Rulesets → Import_ y comprobar que un `push` directo a `main` se rechaza, también al propietario (T10)
- [ ] 2.3 Documentar el flujo de rama y PR en `docs/12-ci-cd.md`, con la excepción del propietario y cómo deshacer la protección (T10)
- [ ] 2.4 Probar el flujo con una PR de prueba: CI en rojo no deja fusionar; en verde, sí, sin pedir aprobación (T10)

## 3. Producción tras la PR

- [ ] 3.1 Comprobar que, tras fusionar una PR, Vercel despliega `main` y que las ramas y PR siguen recibiendo su vista previa (T10)
- [ ] 3.2 Documentar el hueco residual (excepción del propietario y CI que falla sobre el commit de fusión) y la mejora futura del job `deploy` con `needs: ci` en `docs/12-ci-cd.md` y `docs/08-despliegue-vercel.md` (T10)

## 4. APK en el CI

- [ ] 4.1 Añadir el job `apk` (informativo): Node 22, Temurin 21, caché de Gradle, `npm run build:mobile`, `chmod +x android/gradlew`, `assembleDebug` (T10)
- [ ] 4.2 Subir `app-debug.apk` como artefacto de 14 días; instalar la plataforma de Android 36 si el ejecutor no la trae (T10)
- [ ] 4.3 `.gitattributes` con `eol=lf` para `gradlew` y los scripts de shell (T10)
- [ ] 4.4 Descargar el artefacto, instalarlo en un móvil y comprobar que se conecta al servidor de producción (T10)

## 5. Dockerfile de la aplicación

- [ ] 5.1 `next.config.ts`: `output: "standalone"` solo con `NEXT_OUTPUT=standalone`; comprobar que `npm run build` y `npm run build:mobile` no cambian (T10)
- [ ] 5.2 `Dockerfile` multietapa sobre `node:22-bookworm-slim`, usuario sin privilegios, `HEALTHCHECK`, esquema y migraciones de Prisma en la imagen (T10)
- [ ] 5.3 `.dockerignore` (sin `node_modules`, `.next`, `android`, `out-mobile`, `.env*`, `test-results`) y script de arranque con `prisma migrate deploy` (T10)
- [ ] 5.4 Servicio `app` en `docker-compose.yml` bajo el _profile_ `app`, con `AUTH_TRUST_HOST=true` y el resto de variables hacia PostgreSQL y MinIO (T10)
- [ ] 5.5 Job `docker` en el CI que construye la imagen sin publicarla (T10)
- [ ] 5.6 Probar `docker compose --profile app up -d --build`: registrarse, iniciar sesión, crear un tema con imagen y comprobar `/api/health` (T10)

## 6. Cierre

- [ ] 6.1 Actualizar `docs/12-ci-cd.md`: diagrama final con `apk` y `docker` y la protección de `main`, y quitar de la tabla de huecos lo que ya esté cerrado (T10)
- [ ] 6.2 Pruebas del grupo: `npm run lint`, `npm run typecheck`, `npm test`, y comprobar que el workflow es válido (T10)
- [ ] 6.3 Sincronizar con el repositorio de código y el de entrega, y actualizar el README de entrega (T10)
