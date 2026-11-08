## Context

El servidor de la APK se resuelve en dos sitios:

- **`scripts/build-mobile.mjs`**: lee `NEXT_PUBLIC_API_URL` y, si falta y no es `--dev`, aborta con un error.
- **`defaultServerUrl()`** (`src/lib/platform/server-store.ts`): devuelve `NEXT_PUBLIC_API_URL ?? ""`. La usan `apiFetch`, `resolveMediaUrl` y el botón «Restablecer» de `ServerForm`. En la web, `""` significa «mismo origen», así que la web no puede recibir un valor distinto.

El servidor público ya existe: `https://ai4devs-finalproject-jrg.vercel.app` (docs/08-despliegue-vercel.md). `capacitor.config.ts` ya usa el esquema `https` en producción, así que no hay bloqueo de contenido mixto.

## Goals / Non-Goals

**Goals:**
- `npm run build:mobile` produce un APK que conecta con Vercel sin indicar nada.
- Poder seguir apuntando a otro servidor con `NEXT_PUBLIC_API_URL`.
- La web y el build de desarrollo se comportan exactamente igual que ahora.

**Non-Goals:**
- Permitir elegir servidor en producción (sigue siendo solo del build de desarrollo).
- Cambiar el servidor por defecto del build de desarrollo (sigue `http://localhost:3000`).
- Dominio propio ni cambios en Vercel.

## Decisions

**D1. Una constante en un módulo propio, `src/lib/platform/default-server.ts`.**
Exporta `DEFAULT_SERVER_URL = "https://ai4devs-finalproject-jrg.vercel.app"`. Sin imports de Capacitor ni de React.
- *Alternativa: duplicar la URL en el script y en `server-store.ts`.* Descartada: dos sitios que desincronizar si cambia el dominio.
- *Alternativa: guardarla en `.env.production`.* Descartada: Next solo lo lee con `next build`, y `build:mobile:dev` y los tests tendrían que ignorarlo; es más implícito que una constante.

**D2. El script lee la constante del fichero, sin importarlo.**
`build-mobile.mjs` es JavaScript sin transpilar y la constante está en TypeScript. El script extrae el valor con una expresión regular sobre `default-server.ts` (una sola línea `export const DEFAULT_SERVER_URL = "…"`) y falla con un mensaje claro si no la encuentra.
- *Alternativa: escribir `default-server.mjs` y reexportarlo desde un `.ts`.* Descartada: añade un fichero solo para esquivar la lectura; el formato de la línea queda protegido por un test.

**D3. `defaultServerUrl()` aplica el valor de Vercel solo en el build móvil.**
```
NEXT_PUBLIC_API_URL ?? (NEXT_PUBLIC_OPINA_TARGET === "mobile" ? DEFAULT_SERVER_URL : "")
```
`next.config.ts` ya fija `NEXT_PUBLIC_OPINA_TARGET=mobile` en el build móvil. Así la web sigue en mismo origen y un export móvil hecho a mano sin variable no apunta al propio `https://localhost` del WebView.

**D4. En el script, el servidor es: variable → `--dev` → constante.**
`NEXT_PUBLIC_API_URL ?? (dev ? "http://localhost:3000" : DEFAULT_SERVER_URL)`. El script imprime el servidor elegido y, si es el por defecto, lo dice.

**D5. Comprobación de `https` en el script.**
Una `NEXT_PUBLIC_API_URL` que no sea `https://` en el build de producción falla con aviso, porque el APK de release bloquea el HTTP y la app quedaría en «Sin conexión». Antes no se comprobaba.

## Risks / Trade-offs

- **[El dominio de Vercel cambia]** → La constante vive en un único fichero y el README indica cómo sobrescribirla con `NEXT_PUBLIC_API_URL`. Un dominio propio futuro es un cambio de una línea.
- **[Compilar sin querer contra producción con datos de pruebas]** → Es el comportamiento pedido; el script avisa del servidor elegido al terminar.
- **[APK ya instalados]** → Conservan la URL con la que se compilaron; hay que reinstalar.
- **[La expresión regular de D2 se rompe si se reformatea la línea]** → Un test unitario lee el fichero con la misma expresión y falla si no casa.

## Migration Plan

1. Implementar y probar con `npm test`.
2. Recompilar con `npm run build:mobile`, generar el APK y comprobar en el móvil que inicia sesión contra Vercel.
3. Reinstalar la APK en los móviles. Sin cambios de servidor ni de base de datos; el rollback es volver al commit anterior.
