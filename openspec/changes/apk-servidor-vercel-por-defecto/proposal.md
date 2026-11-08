## Why

La API de Opina ya está publicada en Vercel (`https://ai4devs-finalproject-jrg.vercel.app`), pero el build de producción de la APK exige escribir `NEXT_PUBLIC_API_URL` en cada compilación y falla si falta. Quien quiere un APK para el móvil tiene que conocer y recordar la URL, y un olvido o una errata deja una app que no conecta con nada. Ahora que existe un servidor público, esa URL debe ser el valor por defecto.

## What Changes

- `npm run build:mobile` (producción) deja de exigir `NEXT_PUBLIC_API_URL` y usa por defecto `https://ai4devs-finalproject-jrg.vercel.app`. Sigue pudiéndose sustituir con la variable, por ejemplo para apuntar a otro dominio.
- La dirección por defecto vive en un único módulo (`src/lib/platform/default-server.ts`), que usan el script de build y `defaultServerUrl()`.
- Un export de la interfaz para móvil hecho sin `NEXT_PUBLIC_API_URL` (p. ej. `OPINA_TARGET=mobile next build` a mano) usa el servidor de Vercel en lugar de una URL vacía, que en la app nativa apuntaría al propio `https://localhost` del móvil.
- El build de desarrollo (`build:mobile:dev`) no cambia: sigue apuntando a `http://localhost:3000` y con servidor configurable.
- La web no cambia: sigue usando el mismo origen (`defaultServerUrl()` solo aplica el valor de Vercel en el build móvil).
- El script de build muestra a qué servidor queda apuntando la APK.
- Documentación: el README y `docs/08-despliegue-vercel.md` indican que el comando por defecto ya apunta a Vercel.

## Capabilities

### New Capabilities
<!-- Ninguna: se modifica `app-movil`. -->

### Modified Capabilities
- `app-movil`: el requisito «Interfaz empaquetada en la app Android» fija que, sin otra indicación al compilar, el build de producción usa el servidor de Vercel.

## Impact

- **Código**:
  - nuevo `src/lib/platform/default-server.ts`;
  - `src/lib/platform/server-store.ts` (`defaultServerUrl()`);
  - `scripts/build-mobile.mjs`.
- **API, base de datos y Android nativo**: sin cambios. No hay que tocar `capacitor.config.ts`: el esquema `https` del WebView ya es el del build de producción.
- **Pruebas**: test unitario de `defaultServerUrl()` en móvil con y sin `NEXT_PUBLIC_API_URL`, y en web (debe seguir vacío); comprobación de que el script no falla sin variable.
- **Documentación**: `README.md` (sección App Android) y `docs/08-despliegue-vercel.md` (§8.7).
- **Despliegue**: hay que recompilar y reinstalar la APK; las ya instaladas conservan la URL con la que se compilaron.
