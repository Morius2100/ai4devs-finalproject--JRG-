## Context

- **«Sin conexión»**: `NativeShell` (`src/components/native/NativeShell.tsx`) pinta `OfflineScreen` como capa fija (`fixed inset-0 z-50`) encima de toda la app cuando `apiFetch` emite `NETWORK_ERROR_EVENT` o falla `Network.getStatus()`. Mientras se muestra, prueba `GET /api/health` cada 3 s (`RECONNECT_INTERVAL_MS`) y solo se quita cuando responde. La única acción es «Reintentar».
- **Servidor configurable**: en el build de desarrollo (`isServerConfigurable()`) se cambia desde `/servidor` (`ServerScreen`). Se llega por el enlace «Servidor: … · Cambiar» del login o por la opción «Servidor» del `MainMenu`. Las dos entradas quedan tapadas por «Sin conexión».
- **Bloqueo reproducido en el móvil**:
  - Preferences sin `opina.server-url`, así que se usa `http://localhost:3000`;
  - no hay `adb reverse` y sí hay token guardado;
  - resultado: la app arranca directamente en «Sin conexión» y reintenta sin fin.
- **Cambio de servidor actual**: `ServerScreen.switchTo` aplica `setServer`/`resetServer`; si había token llama a `logout()` (en la app solo borra el token local, sin red), hace `queryClient.clear()` y `router.replace("/login")`. Guardar la misma dirección no hace nada y muestra «Ya estás usando este servidor.».

## Goals / Non-Goals

**Goals:**
- Salir de «Sin conexión» en el APK de desarrollo cambiando de servidor desde esa misma pantalla, con o sin sesión.
- Reutilizar exactamente las reglas de validación, comprobación y cambio de servidor de `/servidor`.
- No cambiar nada en la web ni en el APK de producción.

**Non-Goals:**
- Descubrir el servidor automáticamente o sugerir la IP del PC.
- Cambiar el comportamiento de «Sin conexión» en producción.
- Detectar en el primer arranque que no hay servidor guardado y pedirlo antes de intentar conectar.
- Corregir el `TypeError … 'triggerEvent'` que aparece en el arranque, que no bloquea la app.

## Decisions

### D1. Formulario dentro de la capa «Sin conexión», no navegación a `/servidor`

«Cambiar servidor» sustituye, dentro de la misma capa, el texto y «Reintentar» por el formulario de dirección.

*Alternativa:* navegar a `/servidor`. Descartada por dos motivos:
- la capa está por encima de todas las rutas y seguiría tapando `/servidor`;
- quitarla en esa ruta obligaría a acoplar `NativeShell` a la ruta actual, y cualquier `apiFetch` fallido la volvería a poner.

### D2. `ServerForm` extraído de `ServerScreen`

`src/components/native/ServerForm.tsx` contiene lo que hoy hace `ServerScreen`, sin el bloque de «no disponible»:
- campo, «Guardar», «Restablecer» y «Volver»;
- validación con `normalizeServerUrl`, `checkServer` y `switchTo`.

Props:
- `onCancel()`: lo que hace «Volver»;
- `onSwitched?()`: se llama después de cambiar de servidor (tras `logout`, `queryClient.clear()` y `router.replace("/login")`).

Usos:
- `ServerScreen` mantiene el título, el aviso de «no disponible» y usa `ServerForm` con `onCancel = router.back`. No cambia de comportamiento.
- `OfflineScreen` usa `ServerForm` con `onCancel` (cierra el formulario) y `onSwitched` (quita «Sin conexión»).

*Alternativa:* duplicar el formulario en `OfflineScreen`. Descartada: dos copias de las mismas reglas acabarían divergiendo.

### D3. Estado de edición en `NativeShell`, que pausa los reintentos

`NativeShell` guarda `editingServer` (booleano) y se lo pasa a `OfflineScreen` con `onEditServer` / `onCancelEdit`.

- El efecto de reintento automático no programa ticks si `editingServer` es `true`. Al pulsar «Volver» se pone a `false`, y el efecto vuelve a arrancar.
- `onSwitched` hace `setEditingServer(false)` y `setOffline(null)`.
- Que `NETWORK_ERROR_EVENT` o el listener de red cambien `offline` mientras se edita no desmonta `OfflineScreen` (solo cambia `reason`), así que el texto escrito se conserva.

*Alternativa:* estado local en `OfflineScreen`. Descartada porque quien programa los reintentos es `NativeShell`.

### D4. Qué se ve en «Sin conexión» en el build de desarrollo

Debajo de «Reintentar»:
- la línea «Servidor: `<host:puerto>`», con el mismo formato que el login;
- el botón secundario «Cambiar servidor».

Se muestran con las dos causas (`network` y `server`): no tiene coste, y el plugin de red puede informar mal en redes locales sin Internet. En producción (`!isServerConfigurable()`) la pantalla queda como hoy.

### D5. Guardar la misma dirección o «Restablecer»

Se mantienen las reglas de `ServerForm`:
- **misma dirección**: muestra «Ya estás usando este servidor.» y sigue en el formulario;
- **«Restablecer» con otra dirección**: vuelve al servidor del build y aplica `onSwitched`. Si tampoco responde, la app volverá a «Sin conexión» con la primera petición fallida, que es el comportamiento esperado.

## Risks / Trade-offs

- [El usuario abre el formulario y lo deja abierto: la app no se recupera sola aunque vuelva el servidor] → Es intencionado (escenario «Sin reintentos mientras se escribe»). «Volver» reanuda los reintentos, y «Guardar» con el mismo servidor no hace nada.
- [El cierre de sesión al cambiar de servidor no puede avisar al servidor anterior] → En la app, `logout()` solo borra el token local y no hace petición. El servidor no guarda sesiones (JWT), así que no queda nada pendiente.
- [Regresión en `/servidor` al extraer `ServerForm`] → El E2E `tests/e2e/servidor.spec.ts` y un test de componente de `ServerForm` cubren el comportamiento actual.

## Migration Plan

No hay datos ni API que migrar. Al implementarlo: `npm run build:mobile:dev`, `npm run android:apk` y reinstalar el APK. Para volver atrás basta con reinstalar el APK anterior.
