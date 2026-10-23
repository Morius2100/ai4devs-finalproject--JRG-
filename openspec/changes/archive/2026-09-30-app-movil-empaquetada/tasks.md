## 1. Documentación

- [x] 1.1 Actualizar `docs/01-producto.md` (TKT-041):
  - Opina pasa a ser web + app Android;
  - se quita «aplicaciones nativas» del apartado «Fuera de alcance»;
  - se mantienen fuera iOS, push y el uso sin conexión con datos.
- [x] 1.2 Actualizar `docs/06-stack.md` (TKT-041): decisión «Web mobile-first + app Android con Capacitor (interfaz empaquetada)», con sus alternativas.
- [x] 1.3 Actualizar `docs/02-arquitectura.md` (TKT-041):
  - build móvil (D1);
  - rutas `/tema` y `/persona`, con redirecciones;
  - `POST /api/auth/token`, `GET /api/users/[id]`, Bearer y CORS.
- [x] 1.4 Añadir la épica E8 · App móvil con HU-16 (criterios CA-16.1 a CA-16.5) a `docs/04-historias-usuario.md`, y los tickets TKT-041 a TKT-048 a `docs/05-tickets.md` (TKT-041).
- [x] 1.5 Pruebas: `openspec validate app-movil-empaquetada` sin errores y enlaces de la documentación comprobados (TKT-041).

## 2. Backend: sesión por token

- [x] 2.1 Crear `src/server/auth/bearer.ts` (TKT-042):
  - `createAppToken(user)` con `encode` de `next-auth/jwt`, sal `opina.app-token` y `maxAge` de 30 días;
  - `readBearerUser(headers)` con `decode`, que devuelve `{ id, username } | null` y es compatible con Edge.
- [x] 2.2 Crear `src/app/api/auth/token/route.ts` (TKT-042):
  - `POST` valida con `loginSchema`;
  - comprueba con `AuthService.verifyCredentials`;
  - responde `200 { token, user }` o `401` "Credenciales incorrectas".
- [x] 2.3 `requireUser()` usa la cookie (`auth()`) y, si no hay sesión, la cabecera `Authorization: Bearer` (TKT-042).
- [x] 2.4 El middleware considera autenticada una petición con token Bearer válido, además de `request.auth` (TKT-042).
- [x] 2.5 Pruebas de integración para los escenarios de «Sesión por token en la app» y «Protección de pantallas y API» (TKT-042):
  - token correcto;
  - credenciales incorrectas;
  - `GET /api/topics` con Bearer;
  - token manipulado → `401`;
  - una cookie web no sirve como token.

## 3. Backend: CORS y perfil por API

- [x] 3.1 Añadir CORS al middleware para `/api/*` con la lista blanca `https://localhost`, `http://localhost` y `capacitor://localhost` (TKT-043):
  - `OPTIONS` → `204`;
  - cabeceras también en las respuestas `401`;
  - `Vary: Origin`;
  - sin credenciales.
- [x] 3.2 Crear `GET /api/users/[id]` con `UserService.getProfile`: `404` si el id no es un UUID válido o el usuario no existe (TKT-043).
- [x] 3.3 Pruebas de integración (TKT-043):
  - petición previa desde un origen permitido y desde uno no permitido;
  - `GET /api/users/[id]` para el propio perfil, para otra persona y para un id desconocido o inválido.

## 4. Frontend: capa de plataforma y sesión en el cliente

- [x] 4.1 Instalar `@capacitor/app`, `@capacitor/preferences`, `@capacitor/status-bar`, `@capacitor/splash-screen` y `@capacitor/network`, y `@capacitor/assets` como dependencia de desarrollo (TKT-044).
- [x] 4.2 Crear `src/lib/platform/` (TKT-044):
  - `isNativeApp()`;
  - `apiUrl(path)` con `NEXT_PUBLIC_API_URL`;
  - `tokenStore` (Preferences);
  - `apiFetch`, que añade la URL base y el Bearer en la app, y ante un `401` borra el token y navega a `/login`.
- [x] 4.3 Hacer que todos los clientes de `src/lib/api/*` usen `apiFetch`, sin cambiar sus firmas (TKT-044).
- [x] 4.4 Crear `src/lib/auth/client.ts` con `login`, `register` y `logout` (TKT-044):
  - en la web, `next-auth/react`;
  - en la app, token y Preferences.

  Usarlo en las pantallas de login y registro y en `MainMenu`.
- [x] 4.5 Hacer que `SessionProvider` solo monte el de `next-auth` en la web. Crear `AuthGate` para los layouts `(main)` y `tema`, que en la app redirige a `/login` sin token (TKT-044).
- [x] 4.6 Pruebas unitarias (TKT-044):
  - `apiFetch`: URL base, Bearer y `401` → borra el token y redirige;
  - `AuthGate`: con y sin token;
  - `login` de la app: guarda el token.

## 5. Frontend: pantallas de cliente y rutas nuevas

- [x] 5.1 `HomePage`, `PeoplePage` y `NotificationsPage` pasan a cliente (TKT-045):
  - `HomeScreen` y `PeopleScreen` leen `q` con `useSearchParams` dentro de `Suspense`;
  - `TopicList`, `PeopleList` y `NotificationList` cargan la primera página con `useInfiniteQuery`, sin `initialPage`.
- [x] 5.2 Crear `src/app/tema/page.tsx` con `TopicScreen` (TKT-045):
  - `useQuery` de `fetchTopicDetail`;
  - estados de carga y error;
  - «tema no encontrado» ante un `404` o sin `id`.

  Eliminar `src/app/temas/[id]/`.
- [x] 5.3 Crear `src/app/(main)/persona/page.tsx` con `ProfileScreen` en cliente (TKT-045):
  - `fetchUserProfile` y primera página de `ProfileTopics` desde la API;
  - «Persona no encontrada» ante un `404` o sin `id`.

  Eliminar `src/app/(main)/personas/[id]/`.
- [x] 5.4 Actualizar los enlaces a las rutas nuevas (TKT-045):
  - `TopicListItem`, `PersonListItem`, `NotificationItem`;
  - redirección tras crear tema;
  - `BottomNav`: pestaña Personas activa en `/persona`.
- [x] 5.5 Añadir en `next.config.ts`, solo para la web, las redirecciones permanentes `/temas/:id` → `/tema?id=:id` y `/personas/:id` → `/persona?id=:id`, sin afectar a `/temas/nuevo` (TKT-045).
- [x] 5.6 Actualizar las pruebas unitarias (`BottomNav`, `TopicListItem`, `PeopleScreen`…) y las E2E que usan rutas antiguas. Añadir pruebas para (TKT-045):
  - redirección de enlaces antiguos;
  - perfil sin `id`;
  - tema inexistente.

## 6. Build móvil y Capacitor

- [x] 6.1 Añadir a `next.config.ts` el modo `OPINA_TARGET=mobile` (TKT-046):
  - `output: "export"`;
  - `distDir` propio;
  - `images.unoptimized`;
  - `pageExtensions: ["tsx", "js"]`.

  Comprobar en qué carpeta queda el export.
- [x] 6.2 Hacer estático `src/app/pwa-icon/[size]/route.tsx` con `generateStaticParams` (192 y 512) y `dynamic = "force-static"` (TKT-046).
- [x] 6.3 Actualizar `capacitor.config.ts` y eliminar `capacitor-www/` (TKT-046):
  - `webDir` = carpeta del export, sin `server.url`;
  - `androidScheme` `http` con `OPINA_MOBILE_ENV=dev` y `https` en el resto;
  - plugins `SplashScreen` y `StatusBar` configurados.
- [x] 6.4 Añadir scripts a `package.json` y documentarlos en `README.md` (TKT-046):
  - `build:mobile` (export + `cap sync android`);
  - `android:apk` (debug);
  - `android:release` (APK sin firmar).
- [x] 6.5 Pruebas (TKT-046):
  - `npm run build` (web) y `npm run build:mobile` terminan sin errores;
  - el export contiene `index.html`, `tema/index.html` y `persona/index.html`, y no contiene rutas `api/`.

## 7. Funciones nativas

- [x] 7.1 Crear `NativeShell` en el layout raíz, sin efecto en la web (TKT-047):
  - botón atrás (`App.backButton`: atrás o salir);
  - `StatusBar` verde con iconos claros;
  - `SplashScreen.hide()` al montar.
- [x] 7.2 Crear `OfflineScreen` con «Sin conexión» y «Reintentar» (TKT-047):
  - se activa con `Network` y ante errores de red de `apiFetch`;
  - al volver la conexión, recarga la pantalla actual.
- [x] 7.3 Generar el icono del lanzador y la pantalla de arranque desde el logotipo con `@capacitor/assets` y fondo `#035949` (TKT-047).
- [x] 7.4 Pruebas unitarias (TKT-047):
  - `OfflineScreen`: sin red, con red, «Reintentar»;
  - manejador del botón atrás: `canGoBack` verdadero y falso, con `@capacitor/app` simulado.

## 8. Verificación final

- [x] 8.1 Ejecutar `npm run lint`, `npm run typecheck`, `npm test` y `npm run test:e2e` sin fallos (TKT-048).
- [ ] 8.2 Instalar el APK de desarrollo en el móvil con `adb reverse` de los puertos 3000 y 9000 (TKT-048). Comprobar a mano:
  - primera apertura → login;
  - login → pantalla principal;
  - votar un tema;
  - abrir un perfil y añadir un amigo;
  - crear un tema con imagen;
  - botón atrás;
  - modo avión → «Sin conexión»;
  - cerrar y reabrir → sesión conservada;
  - cerrar sesión.
- [x] 8.3 Comprobar que la web mantiene login por cookie, la protección por middleware y las redirecciones de enlaces antiguos (TKT-048).
