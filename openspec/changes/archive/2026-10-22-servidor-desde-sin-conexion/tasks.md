## 1. Documentación

- [x] 1.1 Añadir a HU-22 en `docs/04-historias-usuario.md` el criterio CA-22.5: en el build de desarrollo, «Sin conexión» muestra el servidor en uso y permite cambiarlo, con o sin sesión, para no quedar bloqueado (TKT-072).
- [x] 1.2 Añadir TKT-072 (DOC), TKT-073 (FE) y TKT-074 (QA) a la tabla y al detalle de `docs/05-tickets.md`, en una sección «Servidor desde «Sin conexión» (`servidor-desde-sin-conexion`)» (TKT-072).
- [x] 1.3 En el `README.md`, apartado «App Android en la red local», indicar que si la app se queda en «Sin conexión» se puede pulsar **Cambiar servidor** en esa misma pantalla (TKT-072).

## 2. Formulario de servidor reutilizable

- [x] 2.1 Extraer de `ServerScreen` el componente `src/components/native/ServerForm.tsx` (D2), con:
  - campo, «Guardar», «Restablecer» y «Volver»;
  - validación, comprobación y `switchTo` sin cambios;
  - props `onCancel()` y `onSwitched?()`, que se llama tras `logout`, `queryClient.clear()` y `router.replace("/login")` (TKT-073).
- [x] 2.2 Hacer que `ServerScreen` use `ServerForm` con `onCancel = router.back`, sin cambios de comportamiento en `/servidor` (TKT-073).
- [x] 2.3 Tests de componente de `ServerForm` (TKT-074):
  - dirección mal escrita, sin petición;
  - servidor que no responde, con error y sin guardar;
  - misma dirección, con aviso y sin cerrar sesión;
  - dirección distinta que responde: guarda, borra el token y llama a `onSwitched`.

## 3. «Sin conexión» con cambio de servidor

- [x] 3.1 Ampliar `OfflineScreen` con las props `editingServer`, `onEditServer`, `onCancelEdit` y `onServerSwitched` (D4, TKT-073):
  - con `isServerConfigurable()`, mostrar bajo «Reintentar» la línea «Servidor: `<host:puerto>`» y el botón «Cambiar servidor»;
  - con `editingServer`, mostrar `ServerForm` en lugar del texto y «Reintentar»;
  - sin `isServerConfigurable()`, la pantalla queda como hoy.
- [x] 3.2 En `NativeShell` (D3, TKT-073):
  - guardar `editingServer`;
  - no programar reintentos automáticos mientras sea `true`;
  - al cambiar de servidor, poner `editingServer` a `false` y `offline` a `null`.
- [x] 3.3 Tests de componente (TKT-074):
  - `OfflineScreen` en desarrollo muestra servidor y «Cambiar servidor»;
  - en producción solo muestra «Reintentar»;
  - `NativeShell` no llama a `/api/health` mientras el formulario está abierto y reanuda los reintentos al pulsar «Volver»;
  - tras guardar un servidor que responde, quita «Sin conexión».

## 4. Verificación

- [x] 4.1 Pruebas: `npm run lint`, `npm run typecheck`, `npm test` y `npm run test:e2e` sin fallos, incluido `tests/e2e/servidor.spec.ts` (TKT-074).
- [x] 4.2 Pruebas en el móvil sin cable, en la misma red (TKT-074):
  - con `npm run dev` parado, generar e instalar el APK de desarrollo (`npm run build:mobile:dev`, `npm run android:apk`, `adb install -r`) y después volver a arrancar `npm run dev`;
  - con sesión iniciada y sin servidor guardado, abrir la app: aparece «Sin conexión» con «Servidor: localhost:3000» y «Cambiar servidor»;
  - escribir `http://192.168.5.250:3000`: error y sigue en el formulario;
  - escribir `http://<IP-del-PC>:3000`: se quita «Sin conexión» y aparece el inicio de sesión de ese servidor;
  - iniciar sesión y ver la lista de temas.
