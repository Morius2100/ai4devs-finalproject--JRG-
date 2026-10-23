## Context

- **URL de la API**: `apiFetch` (`src/lib/platform/api-fetch.ts`) antepone `process.env.NEXT_PUBLIC_API_URL`, que Next incrusta al compilar. `npm run build:mobile:dev` la fija en `http://localhost:3000`, que solo llega al PC con `adb reverse`.
- **Red local verificada**:
  - el PC está en `192.168.5.101` (Ethernet, DHCP, perfil Privado);
  - `next dev` escucha en `::` puerto 3000 y el cortafuegos permite Node.js en Privada y Pública;
  - MinIO (9000) escucha en `::`, pero la regla de Docker Desktop solo cubre el perfil Público;
  - hay una VPN (NordLynx) instalada.
- **Imágenes**: `ImageStorage.upload` devuelve `{ url: S3_PUBLIC_URL/<clave>, key }` y se guarda la `url` en `users.avatar_url` y `topics.image_url`. Las del seed son URLs externas (`https://picsum.photos/...`). En la app, `next/image` va sin optimizar, así que el `<img>` pide la URL tal cual.
- **Android**: `targetSdk 36`, sin `usesCleartextTraffic` ni `networkSecurityConfig`. El origen del WebView en desarrollo es `http://localhost` (`androidScheme: "http"`), que el CORS del middleware ya admite. La sesión es un token Bearer, independiente del host.
- **Salud de la API**: `GET /api/health` existe, es pública y la usa `NativeShell` para salir de «Sin conexión».
- **Detección del build**: `isNativeApp()` lee `NEXT_PUBLIC_OPINA_TARGET`, fijado al compilar para que el HTML exportado y el cliente coincidan al hidratar.

## Goals / Non-Goals

**Goals:**
- Usar el APK de desarrollo sin cable contra el PC de la red local, y cambiar de servidor sin recompilar.
- Que las imágenes subidas carguen desde cualquier dispositivo que llegue a la API, sin exponer MinIO.
- Mantener el APK de producción con URL fija y sin HTTP sin cifrar.

**Non-Goals:**
- Descubrir el servidor automáticamente (mDNS o escaneo de red).
- HTTPS en la red local o certificados propios.
- Servidor configurable en el build de producción.
- Redimensionar o transformar imágenes en `/api/media`.

## Decisions

### D1. Servidor en uso: `server-store` con caché síncrona

`src/lib/platform/server-store.ts`:

- `initServer()`: lee `opina.server-url` de `@capacitor/preferences` una vez al arrancar.
- `currentServerUrl()`: devuelve, de forma síncrona, el guardado o `NEXT_PUBLIC_API_URL ?? ""`.
- `setServer(url)` y `resetServer()`.

El acceso síncrono es necesario porque las URLs de imagen se resuelven al pintar.

- `NativeShell` llama a `initServer()` antes de pintar los hijos, y `AuthGate` ya espera a `NativeShell`. En la web no hace nada y la base es `""` (rutas relativas).
- `apiFetch` usa `currentServerUrl()` en lugar de leer la variable directamente.
- La opción de configurar solo existe si `isServerConfigurable()`, es decir, `isNativeApp()` y `NEXT_PUBLIC_OPINA_SERVER_CONFIGURABLE === "true"`. Esa variable la fija `scripts/build-mobile.mjs --dev`, y el build de producción no la define.
- *Alternativa:* leer Preferences en cada `apiFetch`. Descartada porque las imágenes necesitan la URL de forma síncrona.

### D2. Validación y comprobación de la dirección

`normalizeServerUrl(input)`:
- usa `new URL()`;
- solo admite `http:` y `https:`, exige host y descarta ruta, consulta y fragmento;
- devuelve `protocol//host[:port]`.

`checkServer(url)` pide `GET url/api/health` con un tiempo límite de 5 s (`AbortController`) y exige `200` con `{ status: "ok" }`. Solo si pasa se guarda. Funciona entre orígenes porque `/api/health` pasa por el middleware y recibe CORS para `http://localhost`.

### D3. Pantalla «Servidor»: ruta estática `/servidor`

- Página de cliente en el grupo `(auth)`, que reutiliza la cabecera y la tarjeta centrada, accesible sin sesión. Muestra el servidor en uso, un campo de dirección, «Guardar», «Restablecer» y «Volver».
- **Enlaces de entrada**: bajo la tarjeta del login, el texto «Servidor: 192.168.5.101:3000 · Cambiar», y la opción «Servidor» del `MainMenu`. Ambos solo con `isServerConfigurable()`.
- **Al guardar una dirección distinta con sesión iniciada**: `tokenStore.clear()`, `queryClient.clear()` y `router.replace("/login")`. Guardar la misma no hace nada.
- **En la web** (y en producción) la página indica que la opción no está disponible. Como no es pública en el middleware, la web la redirige a `/login`.
- *Alternativa:* diálogo dentro del login. Descartada porque también se necesita desde el menú con sesión iniciada, y una ruta propia sirve para los dos casos.

### D4. Imágenes: clave en base de datos y `GET /api/media/[...key]`

- **Almacenamiento**: `ImageStorage.upload` devuelve `{ key }`; se elimina `keyFromUrl`. Nuevo `read(key): Promise<{ body: Uint8Array; contentType: string } | null>` (S3 `GetObject`; en memoria, el `Map`).
- **Base de datos**: `users.avatar_url` y `topics.image_url` guardan la clave (`avatars/<uuid>.png`) o una URL externa.
- **`toMediaUrl(stored)`** (`src/server/media.ts`): si empieza por `http://` o `https://` la devuelve igual; si no, `/api/media/<clave>`. La usan `TopicService` (resumen y detalle), `UserService` (personas, perfil, perfil propio, amigos) y `StoryService`.
- **Ruta** `src/app/api/media/[...key]/route.ts`:
  - valida la clave con `^(avatars|topics)/[0-9a-f-]{36}\.(jpg|png|webp)$`; si no encaja, `404` sin tocar el almacenamiento, lo que evita rutas como `../.env`;
  - responde con `Content-Type` y `Cache-Control: public, max-age=31536000, immutable` (las claves son únicas y su contenido no cambia).
- **Middleware**: `/api/media` y `/api/health` entran en `PUBLIC_API_PREFIXES`. Un `<img>` no puede enviar `Authorization`, así que exigir sesión rompería las imágenes en la app. La exposición es la misma que con el bucket público: claves aleatorias imposibles de adivinar.
- **Borrar la foto anterior** (`UserService.updateProfile`): se borra si lo guardado es una clave de `avatars/`. Antes se deducía la clave de la URL.
- **Cliente**: `resolveMediaUrl(url)` en `src/lib/platform/` antepone `currentServerUrl()` a las rutas que empiezan por `/`. Lo usan `Avatar`, `TopicImage` y `TopicListItem`.
- **Web**: `next/image` recibe una ruta local (`/api/media/...`) que el optimizador sirve desde el mismo servidor. El host del bucket ya no hace falta en `images.remotePatterns`, aunque se mantiene picsum.photos para el seed.
- *Alternativa:* devolver URLs absolutas con el host de la petición (`request.url`). Descartada porque detrás de un proxy o con `adb reverse` el host visto por el servidor no coincide con el del cliente. Las rutas relativas siempre se resuelven bien.
- *Alternativa:* abrir el puerto 9000 y apuntar `S3_PUBLIC_URL` a la IP del PC. Descartada porque obliga a reescribir las URLs guardadas cada vez que cambia la IP y expone MinIO en la red.

### D5. Migración de datos `media_keys`

SQL en una migración de Prisma, sin cambios de esquema:

```sql
UPDATE users SET avatar_url = substring(avatar_url from '((avatars|topics)/[0-9a-f-]{36}\.(jpg|png|webp))$')
WHERE avatar_url ~ '(avatars|topics)/[0-9a-f-]{36}\.(jpg|png|webp)$' AND avatar_url ~ '^[a-z]+://';
UPDATE topics SET image_url = substring(image_url from '((avatars|topics)/[0-9a-f-]{36}\.(jpg|png|webp))$')
WHERE image_url ~ '(avatars|topics)/[0-9a-f-]{36}\.(jpg|png|webp)$' AND image_url ~ '^[a-z]+://';
```

- Convierte cualquier URL del bucket, con cualquier host (`localhost:9000`, `memory://`), en su clave.
- Las URLs externas (picsum.photos) no encajan con el patrón y quedan igual.
- No depende de `S3_PUBLIC_URL`, así que funciona igual en todos los entornos.

### D6. HTTP sin cifrar solo en `debug`

- `android/app/src/debug/res/xml/network_security_config.xml` con `<base-config cleartextTrafficPermitted="true">`.
- `android/app/src/debug/AndroidManifest.xml`, que el *manifest merger* combina solo en `assembleDebug`, con `android:networkSecurityConfig="@xml/network_security_config"`.
- `release` no recibe nada y mantiene el bloqueo por defecto.
- Se permite cualquier host porque la dirección la elige el usuario en tiempo de ejecución y no se conoce al compilar.
- `cap sync` no toca `src/debug`.
- **Hallazgo al implementarlo:** `cap sync` genera para el módulo `capacitor-cordova-android-plugins` un manifiesto con `android:usesCleartextTraffic="true"`, que se fusiona en **todos** los builds, release incluido. Para que el release bloquee HTTP sin cifrar, `android/app/src/main/AndroidManifest.xml` fija `usesCleartextTraffic="false"` con `tools:replace`. En debug, `networkSecurityConfig` tiene prioridad sobre ese atributo, así que sigue permitiendo HTTP. Se verifica en el manifiesto combinado de cada variante.

### D7. Uso en red local

`README.md` explica:
- configurar `http://<IP-del-PC>:3000` en la app;
- reservar la IP en el DHCP del router;
- que el cortafuegos debe permitir la entrada al puerto 3000 en la red Privada (ya lo hace la regla de Node.js), y que el 9000 deja de ser necesario para el móvil;
- que con la VPN conectada hay que permitir el acceso a la red local (en NordVPN, «Invisibilidad en LAN» desactivada o tunelización dividida);
- que `next dev` y `next start` ya escuchan en todas las interfaces.

## Risks / Trade-offs

- [Las imágenes pasan por Node.js en lugar de directamente por MinIO] → Volumen bajo y caché `immutable` en el cliente. Si hiciera falta, se puede poner un CDN delante de `/api/media`.
- [`/api/media` es público] → Igual que el bucket público actual: claves aleatorias imposibles de adivinar. Validación estricta de la clave.
- [Formato de las URLs de la API (**BREAKING**)] → Solo la consume la propia app. Web y app se despliegan juntas. Las pruebas que comprueban `memory://avatars/...` se actualizan.
- [Un servidor ajeno que responda `/api/health` con `{ status: "ok" }`] → Es una opción de desarrollo; el usuario elige la dirección.
- [`server-store` sin inicializar al pintar] → `NativeShell` no pinta los hijos hasta `initServer()`. La lectura de Preferences es local y rápida.

## Migration Plan

1. Desplegar la migración `media_keys` y el backend a la vez. Después de la migración, el código anterior no sabría pintar claves.
2. Desplegar la web y generar el APK de desarrollo con `npm run build:mobile:dev`, que ahora habilita el servidor configurable.
3. **Vuelta atrás**: revertir el código y ejecutar un `UPDATE` inverso que anteponga `S3_PUBLIC_URL || '/'` a las claves. Se documenta en la migración.

## Open Questions

- Si en el futuro se quiere el servidor configurable también en producción (por ejemplo, para varios entornos), haría falta una opción oculta o protegida. Queda fuera de este cambio.
