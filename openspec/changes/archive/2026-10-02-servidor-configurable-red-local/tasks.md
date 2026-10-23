## 1. Documentación

- [x] 1.1 Añadir a `docs/04-historias-usuario.md` la historia HU-22 «Usar la app de desarrollo en la red local sin cable» en la épica E8 · App móvil (TKT-066), con estos criterios, y actualizar el resumen:
  - CA-22.1: servidor configurable en el build de desarrollo y HTTP sin cifrar solo en debug;
  - CA-22.2: comprobación con `/api/health` antes de guardar;
  - CA-22.3: cambiar de servidor cierra la sesión;
  - CA-22.4: imágenes servidas por la API.
- [x] 1.2 Añadir los tickets TKT-066 a TKT-071 al resumen y al detalle de `docs/05-tickets.md` (TKT-066).
- [x] 1.3 Actualizar `docs/02-arquitectura.md` (TKT-066):
  - `GET /api/media/{clave}` y rutas públicas;
  - `toMediaUrl`;
  - servidor configurable (§2.9);
  - pantalla `/servidor`.
- [x] 1.4 Actualizar `docs/03-modelo-datos.md`: `avatar_url` e `image_url` guardan una clave (`avatars/…`, `topics/…`) o una URL externa (TKT-066).
- [x] 1.5 Añadir al `README.md` la sección «App Android en la red local» (D7) (TKT-066):
  - configurar el servidor;
  - IP y reserva en el DHCP;
  - cortafuegos (3000);
  - VPN.
- [x] 1.6 Pruebas: `openspec validate servidor-configurable-red-local --strict` sin errores (TKT-066).

## 2. Backend: imágenes servidas por la API

- [x] 2.1 `ImageStorage` (TKT-067):
  - `upload` devuelve `{ key }`;
  - nuevo `read(key)`;
  - se elimina `keyFromUrl`;
  - todo ello en `S3ImageStorage` (`GetObject`) e `InMemoryImageStorage`.
- [x] 2.2 Crear `src/server/media.ts` con `MEDIA_KEY_PATTERN` y `toMediaUrl(stored)` (TKT-067).
- [x] 2.3 Guardar claves en `TopicService.create` y `UserService.updateProfile` (borrar la foto anterior si es una clave de `avatars/`). Aplicar `toMediaUrl` en `TopicService`, `UserService` y `StoryService` (TKT-067).
- [x] 2.4 Crear `src/app/api/media/[...key]/route.ts` (TKT-067):
  - validación con `MEDIA_KEY_PATTERN` → `404`;
  - `Content-Type`;
  - `Cache-Control: public, max-age=31536000, immutable`.
- [x] 2.5 Añadir `/api/media` a `PUBLIC_API_PREFIXES` del middleware (`/api/health` ya está) (TKT-067).
- [x] 2.6 Crear la migración `media_keys` con los `UPDATE` de D5 y un comentario con el `UPDATE` inverso. Aplicarla con `migrate deploy` en desarrollo y en pruebas (TKT-067).
- [x] 2.7 Pruebas de integración (TKT-067):
  - `GET /api/media` devuelve la imagen subida con su tipo y caché;
  - `404` con clave inexistente, fuera de carpeta o con `..`;
  - accesible sin sesión (middleware);
  - la API devuelve `/api/media/...` para fotos subidas y la URL externa sin cambios;
  - la migración convierte `http://localhost:9000/opina-images/topics/<id>.png` y `memory://avatars/<id>.png` en claves y no toca `https://picsum.photos/...`;
  - actualizar `me-update.test.ts` y `create-topic.test.ts` al nuevo formato.

## 3. Frontend: servidor configurable

- [x] 3.1 Crear `src/lib/platform/server-store.ts` con `initServer`, `currentServerUrl`, `setServer`, `resetServer`, `isServerConfigurable`, `normalizeServerUrl` y `checkServer` (D1, D2) (TKT-068).
- [x] 3.2 Hacer que `apiFetch` use `currentServerUrl()` y que `NativeShell` espere a `initServer()` antes de pintar los hijos (TKT-068).
- [x] 3.3 Crear la pantalla `src/app/(auth)/servidor/page.tsx` (D3) (TKT-068):
  - servidor en uso;
  - campo con validación;
  - «Guardar» con comprobación y mensaje de error;
  - «Restablecer» y «Volver»;
  - con sesión y servidor distinto, cerrar sesión, vaciar la caché e ir a `/login`.
- [x] 3.4 Añadir el enlace «Servidor: … · Cambiar» bajo el login y la opción «Servidor» en `MainMenu`, solo con `isServerConfigurable()` (TKT-068).
- [x] 3.5 Pruebas unitarias (TKT-068):
  - `normalizeServerUrl`: válidas, sin protocolo, con ruta y con espacios;
  - `checkServer`: 200 correcto, error, tiempo agotado y respuesta inesperada;
  - `server-store`: valor por defecto, guardado, persistencia y restablecer;
  - pantalla `/servidor`: guarda solo si responde y, con sesión, cambiar cierra sesión y guardar el mismo no;
  - enlaces ocultos en web y en producción.

## 4. Frontend: imágenes relativas

- [x] 4.1 Crear `resolveMediaUrl(url)` en `src/lib/platform/` y aplicarlo en `Avatar`, `TopicImage` y `TopicListItem` (TKT-069).
- [x] 4.2 Ajustar `next.config.ts`: `images.remotePatterns` solo para picsum.photos, ya que las imágenes subidas son locales (`/api/media`) (TKT-069).
- [x] 4.3 Pruebas unitarias de `resolveMediaUrl` (TKT-069):
  - ruta relativa en la app con servidor configurado;
  - ruta relativa en la web sin cambios;
  - URL externa sin cambios.

## 5. Android y build

- [x] 5.1 Añadir `android/app/src/debug/AndroidManifest.xml` y `android/app/src/debug/res/xml/network_security_config.xml` (D6) (TKT-070).
- [x] 5.2 Hacer que `scripts/build-mobile.mjs --dev` fije `NEXT_PUBLIC_OPINA_SERVER_CONFIGURABLE=true` y que el build de producción no la defina (TKT-070).
- [x] 5.3 Pruebas (TKT-070):
  - `npm run android:apk` genera el APK de debug con la configuración de red (comprobar el manifiesto combinado en `android/app/build/intermediates`);
  - `npm run android:release` no la incluye.

## 6. Verificación

- [x] 6.1 Pruebas E2E (TKT-071):
  - una foto de perfil subida se sirve desde `/api/media/avatars/...` y se ve en el perfil que ven los demás;
  - `/servidor` no está disponible en la web;
  - actualizar `mi-perfil.spec.ts`, que comprobaba la foto.
- [x] 6.2 Pruebas: `npm run lint`, `npm run typecheck`, `npm test` y `npm run test:e2e` sin fallos (TKT-071).
- [ ] 6.3 Pruebas en el móvil sin cable, en la misma red (TKT-071):
  - instalar el APK de desarrollo;
  - configurar `http://<IP-del-PC>:3000`;
  - iniciar sesión, ver temas con imagen y fotos de perfil, votar y subir una foto;
  - cerrar y reabrir la app (servidor conservado);
  - cambiar a un servidor que no responde (error) y restablecer.
