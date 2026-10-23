## Why

En el APK de desarrollo, si el servidor guardado (o el fijado al compilar, `http://localhost:3000`) no responde, la app queda bloqueada para siempre en «Sin conexión». Esa pantalla tapa toda la app y solo ofrece «Reintentar». Con la sesión iniciada no se llega al inicio de sesión, y el menú principal queda debajo, así que no hay forma de llegar a «Cambiar servidor». Se ha reproducido en el móvil: sin servidor guardado y sin `adb reverse`, la app reintenta `localhost:3000` cada 3 s sin salida. La única forma de recuperarla es borrar sus datos con `adb` o volver a conectar el cable.

## What Changes

- En el build de desarrollo, la pantalla «Sin conexión» muestra el servidor en uso y una opción «Cambiar servidor».
- «Cambiar servidor» abre, dentro de la misma pantalla, el formulario de dirección que ya usa `/servidor`. Mantiene las mismas reglas:
  - la dirección se valida;
  - antes de guardarla se comprueba `GET /api/health`;
  - muestra «No se puede conectar con ese servidor» si no responde;
  - tiene «Restablecer» y «Volver».
- Al guardar un servidor distinto que responde, la app quita «Sin conexión» y sigue las reglas actuales del cambio de servidor: cierra la sesión, borra la caché y lleva al inicio de sesión del nuevo servidor.
- Mientras el formulario está abierto, la app no reintenta sola: así no se cierra mientras el usuario escribe.
- El build de producción no cambia: «Sin conexión» solo muestra «Reintentar».
- El formulario de `/servidor` se extrae a un componente reutilizable, sin cambios de comportamiento en esa pantalla.

## Capabilities

### New Capabilities
<!-- Ninguna: se amplía `app-movil`. -->

### Modified Capabilities
- `app-movil`: el requisito «Pantalla sin conexión» añade, solo en el build de desarrollo, la opción de cambiar de servidor desde esa pantalla, y que la app no reintente sola mientras se edita la dirección.

## Impact

- **Frontend**:
  - `src/components/native/ServerScreen.tsx`: el formulario pasa a un componente `ServerForm` reutilizable;
  - `src/components/native/OfflineScreen.tsx`: servidor en uso y «Cambiar servidor» con `ServerForm`, solo con `isServerConfigurable()`;
  - `src/components/native/NativeShell.tsx`: pausa los reintentos mientras se edita y quita «Sin conexión» al cambiar de servidor.
- **Backend, API, base de datos y Android**: sin cambios.
- **Pruebas**:
  - tests de componente de `OfflineScreen` y `NativeShell`;
  - comprobación en el móvil sin cable.
- **Documentación**:
  - `docs/04-historias-usuario.md`: CA-22.5 en HU-22;
  - `docs/05-tickets.md`: TKT-072 a TKT-074;
  - `README.md`: qué hacer si la app se queda en «Sin conexión».
