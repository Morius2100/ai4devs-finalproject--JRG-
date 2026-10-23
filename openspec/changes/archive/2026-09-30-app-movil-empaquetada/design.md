## Context

- **Hoy Opina es una web full-stack.** Next.js 15 sirve la interfaz y la API (`src/app/api/**/route.ts`) desde un mismo proceso (`docs/06-stack.md` §"Next.js full-stack").
- **El APK actual es solo un contenedor.** `capacitor.config.ts` tiene `server.url = http://localhost:3000`, así que el APK abre la web del PC a través de `adb reverse`. `capacitor-www/index.html` es un marcador vacío.
- **Cinco pantallas dependen del servidor.** Consultan servicios directamente en un Server Component:
  - `src/app/(main)/page.tsx` → `TopicService.listTrending/search`.
  - `src/app/temas/[id]/page.tsx` → `TopicService.getById` + `notFound()`.
  - `src/app/(main)/personas/[id]/page.tsx` → `UserService.getProfile` + `TopicService.listByAuthor`.
  - `src/app/(main)/personas/page.tsx` → `UserService.search`.
  - `src/app/(main)/notificaciones/page.tsx` → `NotificationService.listForUser`.

  El resto de la interfaz ya son componentes de cliente que usan `src/lib/api/*` con TanStack Query.
- **Sesión.** Auth.js v5 con estrategia JWT en cookie (`src/server/auth/config.ts`). El middleware (`src/middleware.ts`, Edge) redirige a `/login` o responde `401`. En el cliente se usan `signIn`, `signOut` y `SessionProvider` de `next-auth/react`.
- **Cliente HTTP.** `fetch` con rutas relativas (`/api/...`) y `parseJson` en `src/lib/api/http.ts`.
- **Imágenes.** URLs absolutas del bucket S3 (`S3_PUBLIC_URL`) mostradas con `next/image`, que en un export estático no tiene optimizador.
- **Entorno disponible.** Android SDK, JDK 21 de Android Studio (`jbr`) y Capacitor 8 (`@capacitor/core`, `@capacitor/android`, `@capacitor/cli`) ya instalados. Proyecto `android/` generado.
- **Documentación local de Next.js.** `node_modules/next/dist/docs/`, que menciona `AGENTS.md`, no existe en esta instalación. Las decisiones sobre `output: "export"` y `pageExtensions` se han comprobado en `node_modules/next/dist/build/index.js`: `pageExtensions` filtra rutas de app, `middleware` e `instrumentation`.

## Goals / Non-Goals

**Goals:**
- El APK contiene la interfaz completa y funciona sin el PC, contra una API desplegada.
- Un único código de interfaz para web y app. Las diferencias se limitan a una capa pequeña: URL base, sesión y funciones nativas.
- La web conserva su comportamiento y su sesión por cookie, y los enlaces antiguos siguen funcionando.
- Integración nativa básica: botón atrás, barra de estado, arranque y pantalla sin conexión.

**Non-Goals:**
- Uso sin conexión con datos en caché o cola de votos pendientes. Sin red solo se muestra «Sin conexión».
- Notificaciones push, cámara nativa (se usa el selector de archivos del sistema), enlaces profundos y versión iOS.
- Publicación en Google Play (firma de release, ficha de tienda). Se documenta cómo generar el APK de release, pero no se publica.
- Cambios en el modelo de datos o en las reglas de negocio.

## Decisions

### D1. Build móvil con `output: "export"` y `pageExtensions: ["tsx", "js"]`

`next.config.ts` lee `OPINA_TARGET=mobile`. En ese modo activa:
- `output: "export"` con `distDir: "out-mobile"`, que es la carpeta del export. Next compila igualmente en `.next`, así que el build móvil no se lanza con `next dev` en marcha y tras él hay que recompilar la web antes de `next start`;
- `trailingSlash: true`, para que cada pantalla sea `<ruta>/index.html` en el servidor local de Capacitor;
- `images.unoptimized: true`;
- `pageExtensions: ["tsx", "js"]`. Con solo `tsx` falla la compilación de las páginas en grupos de rutas, porque Next necesita `.js` para sus páginas internas. En `src/app` no hay archivos `.js`.

Todas las rutas de la API, `manifest.ts`, `middleware.ts` e `instrumentation.ts` son `.ts`, así que quedan fuera del build móvil sin mover archivos. La web sigue usando las extensiones por defecto.

`capacitor.config.ts` pasa a `webDir` = carpeta del export, sin `server.url`, y se elimina `capacitor-www/`. El script `build:mobile` compila con `OPINA_TARGET=mobile` y ejecuta `cap sync android`.

- *Alternativa:* un segundo proyecto frontend (Vite + React). Descartada porque duplica pantallas y componentes.
- *Alternativa:* mover `src/app/api` temporalmente durante el build. Descartada por frágil: deja el árbol roto si el build falla.

`src/app/pwa-icon/[size]/route.tsx` y `src/app/apple-icon.tsx` son `.tsx`, así que sí entran en el build móvil. Reciben `dynamic = "force-static"` (y el primero `generateStaticParams` con 192 y 512), válido en ambos modos.

### D2. Rutas por parámetro de consulta: `/tema?id=` y `/persona?id=`

El export estático solo genera las rutas dinámicas conocidas al compilar, y los temas se crean en tiempo de ejecución. Por eso:
- `src/app/temas/[id]` pasa a `src/app/tema/page.tsx`, fuera de `(main)`, igual que ahora.
- `src/app/(main)/personas/[id]` pasa a `src/app/(main)/persona/page.tsx`.

Cada pantalla lee `id` con `useSearchParams` dentro de `<Suspense>`, como exige el export. En la web, `next.config.ts` define `redirects()` permanentes `/temas/:id` → `/tema?id=:id` y `/personas/:id` → `/persona?id=:id`. `/temas/nuevo` se declara antes para que no lo capture la redirección.

- *Alternativa:* un segmento `[id]` con un único parámetro ficticio y reescritura en el servidor local de Capacitor. Descartada porque el servidor de Capacitor no permite reescrituras por patrón.

### D3. Pantallas de cliente con TanStack Query

- `HomeScreen` y `PeopleScreen` reciben la búsqueda desde `useSearchParams`. `TopicList`, `PeopleList` y `NotificationList` cargan la primera página con `useInfiniteQuery` (se elimina `initialPage`).
- `TopicScreen` (nuevo) usa `useQuery(["topic", id], fetchTopicDetail)`. Pinta `TopicView` o la pantalla «tema no encontrado» con un `404` (se reutiliza el contenido de `not-found.tsx` como componente).
- `ProfileScreen` usa `fetchUserProfile` (nuevo `GET /api/users/[id]`, que reutiliza `UserService.getProfile`). La primera página de temas la carga el propio `ProfileTopics`.
- Los estados de carga usan esqueletos sencillos con los estilos actuales.

La web pierde el renderizado en servidor de la primera página. Se acepta: la interfaz es la misma en ambos destinos y los datos llegan en una sola petición.

### D4. Sesión de la app: token JWE de Auth.js por `Authorization: Bearer`

- `POST /api/auth/token`:
  - valida con `loginSchema` y `AuthService.verifyCredentials`;
  - devuelve `{ token, user: { id, username } }`, con el token creado por `encode` de `next-auth/jwt` (mismo `AUTH_SECRET`, sal propia `opina.app-token`, `maxAge` de 30 días);
  - responde `401` con "Credenciales incorrectas" si fallan las credenciales.

  Está bajo `/api/auth/*`, que ya es pública en el middleware.
- `src/server/auth/bearer.ts`: `readBearerUser(request | headers)` descifra con `decode` y devuelve `{ id, username } | null`. Funciona en Edge porque `jose` no depende de Node.
- `requireUser()` usa primero `auth()` (cookie) y, si no hay sesión, la cabecera `Authorization` (`headers()` de `next/headers`).
- El middleware considera autenticada la petición si `request.auth` existe o si el token Bearer es válido.
- La sal propia impide usar una cookie web como token Bearer y al revés.

- *Alternativa:* JWT firmado con `jose` (HS256). Descartada porque añade un segundo formato de token; con `encode`/`decode` se reutilizan secreto, caducidad y verificación de Auth.js.
- *Alternativa:* cookies de sesión dentro del WebView. Descartada porque el origen de la app (`https://localhost`) es distinto del de la API, y las cookies de terceros en WebView con `SameSite=None` son frágiles y requieren CSRF.

### D5. Capa de plataforma en el cliente (`src/lib/platform/*`)

- `isNativeApp()`: `Capacitor.isNativePlatform()`.
- `apiUrl(path)`: `process.env.NEXT_PUBLIC_API_URL ?? ""` + `path`. Todos los `fetch` de `src/lib/api/*` pasan por un `apiFetch` que añade la URL base y, en la app, la cabecera Bearer.
- Ante un `401`, `apiFetch` borra el token y navega a `/login`.
- `src/lib/auth/client.ts` expone `login`, `logout` y `useIsAuthenticated`:
  - en la web delegan en `signIn` y `signOut` de `next-auth/react`;
  - en la app usan `POST /api/auth/token` y `@capacitor/preferences`.

  Las pantallas de login y registro y `MainMenu` usan solo este módulo.
- `SessionProvider` de `next-auth/react` solo se monta en la web. En la app haría peticiones a `/api/auth/session` relativas al origen local.
- `AuthGate` (cliente, en los layouts protegidos): en la app, sin token, `router.replace("/login")` y no pinta nada. En la web no actúa, porque el middleware ya protege.

### D6. CORS en el middleware

El middleware atiende `OPTIONS` en `/api/*` antes de la comprobación de sesión y añade las cabeceras CORS a las respuestas `/api/*`, solo si `Origin` está en la lista permitida (`https://localhost`, `http://localhost`, `capacitor://localhost`):
- `Access-Control-Allow-Origin` con el origen exacto y `Vary: Origin`;
- métodos `GET, POST, PUT, DELETE, OPTIONS`;
- cabeceras `Authorization, Content-Type`;
- sin `Allow-Credentials`.

Las respuestas `401` del middleware también llevan estas cabeceras, para que la app pueda leerlas. Las respuestas de los route handlers pasan por el middleware (`NextResponse.next()` con las cabeceras de respuesta añadidas).

### D7. Funciones nativas con plugins oficiales de Capacitor

| Plugin | Uso |
| --- | --- |
| `@capacitor/app` | `backButton`: `history.back()` si `canGoBack`; si no, `App.exitApp()` |
| `@capacitor/status-bar` | color `#035949`, estilo `Dark` (iconos claros) |
| `@capacitor/splash-screen` | fondo `#035949` con el logotipo; `SplashScreen.hide()` al montar la interfaz |
| `@capacitor/network` | estado inicial y cambios; alimenta `OfflineScreen` |
| `@capacitor/preferences` | token de sesión |

- Todo se inicializa en un componente `NativeShell` montado en el layout raíz, que en la web no hace nada.
- Si la API no responde (error de red en `fetch`), `apiFetch` también activa `OfflineScreen`.
- El icono del lanzador y el arranque se generan desde el logotipo existente con `@capacitor/assets` (dependencia de desarrollo).

### D8. URL de la API y entornos

- `NEXT_PUBLIC_API_URL` se fija al compilar el build móvil.
- Desarrollo con cable: `http://localhost:3000` con `adb reverse tcp:3000` (y `tcp:9000` para MinIO). Para evitar contenido mixto se usa `androidScheme: "http"` solo en el build de desarrollo (`OPINA_MOBILE_ENV=dev`).
- Producción: URL HTTPS del despliegue y `androidScheme: "https"`.

## Risks / Trade-offs

- [Se pierde el SSR de la primera página en la web] → Carga con esqueleto; una sola petición por pantalla. Se puede reintroducir más adelante solo para la web si hiciera falta.
- [Token guardado en el dispositivo] → `@capacitor/preferences` usa SharedPreferences privadas de la app, a las que no acceden otras apps sin root. Caduca en 30 días y cerrar sesión lo borra. Keystore cifrado queda fuera de alcance.
- [CORS mal configurado expone la API a otras webs] → Lista blanca exacta, sin credenciales de cookie, y pruebas de integración para origen permitido y no permitido.
- [`pageExtensions: ["tsx", "js"]` excluye por accidente un `.ts` necesario para el cliente] → Solo afecta a archivos de rutas (`page`, `layout`, `route`, `middleware`…), no a módulos importados. La verificación final (tarea 6.5) comprueba qué contiene el export.
- [Imágenes con URL `localhost:9000` en desarrollo] → `adb reverse tcp:9000 tcp:9000`. En producción `S3_PUBLIC_URL` debe ser pública.
- [Cambian las URLs de tema y perfil] → Redirecciones permanentes en la web y actualización de las pruebas E2E y de integración que las usan.

## Migration Plan

1. Desplegar el backend con los nuevos endpoints, Bearer y CORS. Es compatible hacia atrás: la web sigue con cookie.
2. Desplegar la web con las rutas nuevas y las redirecciones.
3. Compilar el APK con `NEXT_PUBLIC_API_URL` apuntando al despliegue e instalarlo.
4. Vuelta atrás: revertir el despliegue web. Los endpoints nuevos no molestan a la web anterior, y el APK anterior (contenedor) sigue funcionando contra la URL que cargaba.

## Open Questions

- URL de producción de la API. Hasta tenerla, el build de producción no se puede probar sin el PC; el de desarrollo usa `adb reverse`.
- Identificador de la app (`com.opina.app`) y firma para Google Play, que quedan para cuando se decida publicar.
