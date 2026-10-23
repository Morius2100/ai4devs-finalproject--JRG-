## Why

Opina se diseñó como aplicación web _mobile-first_. `docs/06-stack.md` descarta la app nativa y `docs/01-producto.md` la deja fuera del alcance. El APK que se genera hoy con Capacitor no contiene la aplicación: es una ventana que carga `http://localhost:3000` desde el PC a través del cable (`adb reverse`). Sin el ordenador encendido y conectado, la app no abre.

Tres rasgos de la arquitectura lo impiden:

- Cinco pantallas (inicio, tema, Personas, perfil y notificaciones) son Server Components que consultan la base de datos directamente.
- La sesión depende de una cookie del mismo dominio y el middleware redirige a `/login` desde el servidor.
- El cliente llama a la API con rutas relativas (`/api/...`).

Este cambio convierte Opina en una app Android real. La interfaz va empaquetada dentro del APK y se conecta a la API desplegada. La web actual sigue funcionando igual.

## What Changes

- **Interfaz empaquetada en el APK**:
  - Un build específico para móvil exporta el frontend como archivos estáticos (`output: "export"`).
  - Capacitor copia esos archivos dentro del APK.
  - El APK deja de cargar una URL remota (se retira `server.url` de `capacitor.config.ts`).
- **Pantallas de cliente**:
  - Inicio, tema, Personas, perfil y notificaciones pasan a pedir sus datos a la API desde el cliente en lugar de consultar la base de datos en el servidor.
  - Muestran estados de carga y de error.
- **BREAKING — nuevas rutas de tema y perfil**:
  - `/temas/[id]` pasa a `/tema?id=<id>` y `/personas/[id]` pasa a `/persona?id=<id>`, porque el export estático no admite segmentos dinámicos con identificadores desconocidos al compilar.
  - En la web, las rutas antiguas redirigen permanentemente a las nuevas para no romper enlaces compartidos.
- **Sesión por token para la app**:
  - Nuevo endpoint `POST /api/auth/token` que, con email y contraseña válidos, devuelve un token de sesión con la misma duración (30 días) y el mismo contenido que la sesión web.
  - La app guarda el token en el almacenamiento nativo y lo envía como `Authorization: Bearer` en cada petición.
  - Tras registrarse, la app obtiene el token de la misma forma.
  - Cerrar sesión borra el token.
  - La web mantiene la cookie actual.
- **API accesible desde la app**:
  - El middleware y `requireUser` aceptan la cookie o el token Bearer.
  - `/api/*` responde a CORS (incluida la petición previa `OPTIONS`) solo para los orígenes de la app Capacitor.
  - Nuevo `GET /api/users/[id]` con el perfil que hoy solo se obtiene desde el servidor.
- **Cliente HTTP configurable**: `src/lib/api/*` usa una URL base (`NEXT_PUBLIC_API_URL`) que en la web queda vacía (rutas relativas) y en la app apunta al servidor desplegado.
- **Protección de pantallas en la app**: sin middleware en el export, un guardián de cliente redirige a `/login` cuando no hay token y cuando la API responde `401`.
- **Comportamiento nativo en Android**:
  - El botón «atrás» del sistema navega hacia atrás y, en la pantalla principal, cierra la app.
  - Barra de estado y pantalla de arranque con los colores de marca.
  - Pantalla «Sin conexión» con opción de reintentar.
- **Documentación**:
  - `docs/01-producto.md` y `docs/06-stack.md`: Opina pasa a ser web + app Android.
  - `docs/02-arquitectura.md`: build móvil, token y CORS.
  - `README.md`: cómo generar e instalar el APK.

## Capabilities

### New Capabilities
- `app-movil`: app Android empaquetada con la interfaz de Opina, conexión a la API configurable, protección de pantallas en el cliente, botón atrás del sistema, barra de estado y arranque con la marca, y pantalla sin conexión.

### Modified Capabilities
- `identificacion-usuarios`:
  - La protección de la API acepta también un token Bearer.
  - Nuevo requisito de sesión por token para la app (obtención, persistencia y cierre).
- `personas`: el perfil se abre en `/persona?id=<id>` (acceso desde la lista y perfil inexistente).
- `amistades`: el propio perfil se abre en `/persona?id=<id>`.
- `menu-inferior`: la pestaña Personas está activa en `/persona`.
- `identidad-visual`: la tarjeta de tema abre `/tema?id=<id>`.

## Impact

- **Código**:
  - `src/app/(main)/page.tsx`, `src/app/temas/[id]/*` y `src/app/(main)/personas/[id]/*` se sustituyen por pantallas de cliente en `src/app/tema/` y `src/app/(main)/persona/`.
  - Enlaces en `TopicListItem`, `PersonListItem`, `NotificationItem`, `BottomNav` y en la pantalla de creación de temas.
  - Autenticación en `src/server/auth/*`, `src/middleware.ts`, las pantallas de login y registro, `MainMenu` y `SessionProvider`.
  - Clientes de `src/lib/api/*`.
- **API**: nuevos `POST /api/auth/token` y `GET /api/users/[id]`; CORS y Bearer en `/api/*`. Los contratos existentes no cambian.
- **Configuración**: `next.config.ts` (modo móvil con export, imágenes sin optimizar, redirecciones web), `capacitor.config.ts`, proyecto `android/`, scripts de `package.json`.
- **Dependencias**: plugins de Capacitor `@capacitor/app`, `@capacitor/preferences`, `@capacitor/status-bar`, `@capacitor/splash-screen` y `@capacitor/network`.
- **Pruebas**: se actualizan las de integración y E2E que usan las rutas antiguas, y se añaden pruebas para el token, CORS y `GET /api/users/[id]`.
- **Despliegue**: la app necesita el backend desplegado con HTTPS. Las imágenes S3 deben tener una URL pública accesible desde el móvil (en local, `adb reverse` de los puertos 3000 y 9000).
