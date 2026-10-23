## Why

La app Android solo funciona con el móvil conectado por cable. El build de desarrollo lleva fija al compilar la URL `http://localhost:3000`, que solo llega al PC gracias a `adb reverse`. Al desconectar el USB, `localhost` pasa a ser el propio móvil y la app deja de funcionar, aunque móvil y PC estén en la misma red y el servidor ya sea accesible desde ella (escucha en todas las interfaces y el cortafuegos permite Node.js).

Hay tres obstáculos más:

- **Imágenes subidas:** se guardan con una URL absoluta del bucket (`http://localhost:9000/opina-images/...`), así que tampoco cargan desde otro dispositivo. Además, la regla de Docker en el cortafuegos de Windows solo cubre el perfil de red Público, y la red del PC es Privada.
- **HTTP sin cifrar:** Android (API 36) bloquea por defecto HTTP sin cifrar hacia una IP de la red local.
- **IP cambiante:** el PC recibe la IP por DHCP (`192.168.5.101`), y si cambia habría que recompilar la app.

## What Changes

- **Servidor configurable en el build de desarrollo**, sin recompilar:
  - en la pantalla de inicio de sesión se ve el servidor actual y se puede cambiar;
  - antes de guardarlo se comprueba que responde (`GET /api/health`);
  - se guarda en el dispositivo, y si no hay ninguno se usa el que lleva el build;
  - cambiar de servidor cierra la sesión, porque el token pertenece al servidor anterior;
  - el menú principal muestra el servidor en uso y permite cambiarlo.

  En el build de producción la URL sigue fija y no se muestra esta opción.
- **Imágenes servidas a través de la API** (**BREAKING** en el formato de las URLs):
  - nuevo `GET /api/media/{key}` para fotos de perfil (`avatars/`) y de temas (`topics/`), con caché y sin sesión, como ya ocurría con el bucket público;
  - la base de datos guarda la clave (`avatars/<uuid>.png`) en lugar de la URL;
  - la API devuelve rutas relativas (`/api/media/avatars/<uuid>.png`) y el cliente las resuelve contra el servidor en uso;
  - una migración de datos convierte las URLs ya guardadas a clave y deja intactas las externas (las del seed, de picsum.photos);
  - el móvil deja de necesitar acceso directo al puerto 9000 (MinIO).
- **HTTP sin cifrar solo en el APK de depuración**, mediante una configuración de seguridad de red propia del build `debug`. El de release no lo permite.
- **Rutas públicas de la API documentadas**: `/api/health` (ya existe) y `/api/media/*` no exigen sesión.
- **Documentación**: uso en red local en el `README.md` (IP del PC, reserva en el DHCP del router, regla de cortafuegos para el puerto 3000, VPN con acceso a la red local).

## Capabilities

### New Capabilities
<!-- Ninguna: se amplía `app-movil`. -->

### Modified Capabilities
- `app-movil`:
  - la URL de la API deja de ser solo de compilación en el build de desarrollo (requisito «Interfaz empaquetada en la app Android»);
  - nuevos requisitos: servidor configurable, cambio de servidor, imágenes servidas por la API y HTTP sin cifrar solo en desarrollo.
- `identificacion-usuarios`: «Protección de pantallas y API» añade `/api/health` y `/api/media/*` a las rutas públicas.

## Impact

- **Base de datos**: migración de datos `media_keys` (`users.avatar_url` y `topics.image_url` pasan de URL del bucket a clave). No cambia el esquema.
- **Backend**:
  - `ImageStorage` gana `read(key)`;
  - `upload` devuelve la clave;
  - nueva ruta `src/app/api/media/[...key]/route.ts`;
  - utilidad `toMediaUrl` aplicada en `TopicService`, `UserService` y `StoryService`;
  - el middleware hace públicas `/api/media/*` y `/api/health`.
- **Frontend**:
  - `src/lib/platform/server-store.ts` (servidor en uso) y `apiFetch` lo usa;
  - `resolveMediaUrl` en `Avatar`, `TopicImage` y `TopicListItem`;
  - selector de servidor en `AuthLayout` y `MainMenu`;
  - flag de build `NEXT_PUBLIC_OPINA_SERVER_CONFIGURABLE` en `scripts/build-mobile.mjs --dev`.
- **Android**: `android/app/src/debug/AndroidManifest.xml` y `res/xml/network_security_config.xml` solo para `debug`.
- **Configuración**: `next.config.ts` deja de necesitar el host del bucket en `images.remotePatterns` para las imágenes subidas. `S3_PUBLIC_URL` deja de usarse para construir URLs.
- **Documentación**:
  - `README.md`;
  - `docs/02-arquitectura.md` (API de medios, servidor configurable);
  - `docs/03-modelo-datos.md` (claves de imagen);
  - historia HU-22 y tickets TKT-066 a TKT-071.
