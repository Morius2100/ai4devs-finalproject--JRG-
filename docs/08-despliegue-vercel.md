# 8. Despliegue en Vercel (Neon + Cloudflare R2)

Guía para publicar Opina gratis con despliegue automático desde GitHub:

| Pieza                      | Servicio              | Plan gratuito (revisar límites actuales)        |
| -------------------------- | --------------------- | ----------------------------------------------- |
| Servidor Next.js (web+API) | **Vercel** (Hobby)    | Uso no comercial; peticiones de hasta 4,5 MB    |
| PostgreSQL                 | **Neon**              | 1 proyecto, ~0,5 GB; se suspende sin uso        |
| Imágenes (S3 compatible)   | **Cloudflare R2**     | 10 GB; activar R2 puede pedir un método de pago |

Cada `git push` a `main` publica en producción; cada rama o PR recibe una URL de vista previa.

## 8.1 Qué hay preparado en el proyecto

- **`npm run vercel-build`** ([scripts/vercel-build.mjs](../scripts/vercel-build.mjs)): Vercel lo ejecuta en lugar de `build`. Hace `prisma generate`, `prisma migrate deploy` (solo en producción) y `next build`. Las migraciones usan la conexión **directa** de Neon (`DATABASE_URL_UNPOOLED` o `DIRECT_URL`); la aplicación usa la conexión con _pooling_ (`DATABASE_URL`).
- **Límite de subida**: imágenes de hasta **4 MB** y peticiones de hasta 4,5 MB, el máximo que acepta una función de Vercel.
- **R2**: el cliente S3 solo calcula sumas de comprobación cuando la operación las exige, como recomienda Cloudflare. Las imágenes se sirven desde la API (`/api/media/...`), así que **el bucket puede ser privado**.

## 8.2 Paso 1 — Subir el código a GitHub

1. Crea un repositorio vacío en GitHub (sin README ni `.gitignore`).
2. Conéctalo y sube `main`:

```bash
git remote add origin https://github.com/<usuario>/<repo>.git
git push -u origin main
```

`.env` y `.env.test` están en `.gitignore` y no se suben.

## 8.3 Paso 2 — Base de datos en Neon

Opción A (recomendada): desde Vercel, en el paso 4, pestaña **Storage → Neon → Create**. La integración crea la base de datos y define sola `DATABASE_URL` (con _pooling_) y `DATABASE_URL_UNPOOLED` (directa) en el proyecto.

Opción B (a mano), en [neon.tech](https://neon.tech):

1. **New project** → región **AWS Europe Central (Frankfurt)**, Postgres 16.
2. En **Connect**, copia dos cadenas:
   - Con **Connection pooling** activado → será `DATABASE_URL` (el host lleva `-pooler`).
   - Sin _pooling_ → será `DIRECT_URL`.
3. Añade `&connect_timeout=15` al final de ambas: la primera consulta tras una suspensión tarda un poco más.

## 8.4 Paso 3 — Bucket en Cloudflare R2

En el panel de Cloudflare → **R2 Object Storage**:

1. **Create bucket** → nombre `opina-images`, ubicación automática. Déjalo **privado** (no hace falta acceso público).
2. Copia el **Account ID** (aparece en la página de R2). El endpoint es `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.
3. **Manage R2 API Tokens → Create API token** → permiso **Object Read & Write**, limitado al bucket `opina-images`. Guarda el **Access Key ID** y el **Secret Access Key** (el secreto solo se muestra una vez).

## 8.5 Paso 4 — Proyecto en Vercel

1. En [vercel.com](https://vercel.com) → **Add New → Project → Import Git Repository** → elige el repositorio. Vercel detecta Next.js; no cambies los comandos (usará `vercel-build`).
2. En **Environment Variables** añade (para _Production_ y _Preview_):

| Variable               | Valor                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`         | Cadena de Neon **con** _pooling_ (la crea la integración en la opción A)                           |
| `DIRECT_URL`           | Cadena de Neon **sin** _pooling_ (solo opción B)                                                   |
| `AUTH_SECRET`          | Un secreto nuevo: `npx auth secret` (no reutilices el de desarrollo)                               |
| `S3_ENDPOINT`          | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`                                                    |
| `S3_REGION`            | `auto`                                                                                             |
| `S3_BUCKET`            | `opina-images`                                                                                     |
| `S3_ACCESS_KEY_ID`     | Access Key ID del token de R2                                                                      |
| `S3_SECRET_ACCESS_KEY` | Secret Access Key del token de R2                                                                  |
| `S3_PUBLIC_URL`        | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com/opina-images` (obligatoria, no se usa para servir) |
| `AUTH_URL`             | Opcional: la URL pública si usas un dominio propio                                                 |

3. **Deploy**. El primer despliegue aplica las migraciones en Neon.
4. En **Settings → Functions → Function Region** elige **Frankfurt (fra1)**, cerca de Neon, y vuelve a desplegar.
5. Comprueba que responde `https://<proyecto>.vercel.app/api/health`, regístrate y crea un tema con imagen.

## 8.6 Paso 5 (opcional) — Datos de ejemplo

Desde tu PC, contra la cadena **directa** de Neon:

```bash
DATABASE_URL="<cadena-directa-de-neon>" npm run prisma:seed
```

Crea los usuarios de ejemplo (`ana@opina.test` / `password123`…). En una base de datos pública, cambia esas contraseñas o no ejecutes el seed.

## 8.7 Paso 6 — APK que usa el servidor publicado

La APK de producción lleva fijada la URL de la API al compilar y exige HTTPS:

```bash
NEXT_PUBLIC_API_URL=https://<proyecto>.vercel.app npm run build:mobile
```

```bash
npm run android:apk
```

`android:apk` genera una APK firmada con la clave de depuración (`android/app/build/outputs/apk/debug/`), que se puede pasar e instalar directamente en otros móviles (permitiendo «orígenes desconocidos»). Para Google Play, usa `npm run android:release` y firma con tu keystore.

Como la URL de Vercel no cambia entre despliegues, solo hay que recompilar la APK cuando cambia la interfaz, no cuando cambia el servidor.

## 8.8 Vistas previas y migraciones

`vercel-build` solo migra cuando `VERCEL_ENV=production`, para que una rama no altere la base de datos de producción. Si una vista previa necesita una migración nueva:

- Con la integración de Neon, activa **Preview branches**: cada vista previa recibe su propia rama de base de datos. Define entonces `RUN_MIGRATIONS=1` en el entorno _Preview_.
- Sin ella, prueba la migración en local antes de fusionar en `main`.

## 8.9 Problemas frecuentes

| Síntoma                                                | Causa / solución                                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| El build falla con «Variables de entorno inválidas»    | Falta alguna variable de 8.5 en el entorno que se está construyendo (_Preview_ incluido)    |
| `prepared statement "s0" already exists`               | Añade `&pgbouncer=true` a `DATABASE_URL` (cadena con _pooling_)                             |
| `413` o `FUNCTION_PAYLOAD_TOO_LARGE` al subir imágenes | La imagen supera 4 MB                                                                       |
| `SignatureDoesNotMatch` / `AccessDenied` al subir      | Endpoint, región (`auto`) o token de R2 incorrectos, o el token no incluye el bucket        |
| La primera petición tarda 1–2 s                        | Neon reanuda la base de datos suspendida; es normal en el plan gratuito                     |
| La APK no conecta                                      | Debe compilarse con `NEXT_PUBLIC_API_URL` en **https**; comprueba `/api/health` en el móvil |
