## 1. Servidor por defecto

- [x] 1.1 Crear `src/lib/platform/default-server.ts` con `export const DEFAULT_SERVER_URL = "https://ai4devs-finalproject-jrg.vercel.app";` en una sola línea
- [x] 1.2 Cambiar `defaultServerUrl()` en `src/lib/platform/server-store.ts`: `NEXT_PUBLIC_API_URL`, y si falta y `NEXT_PUBLIC_OPINA_TARGET === "mobile"`, `DEFAULT_SERVER_URL`; en la web, `""`
- [x] 1.3 Cambiar `scripts/build-mobile.mjs`: leer `DEFAULT_SERVER_URL` de `default-server.ts` y usar variable → `--dev` (`http://localhost:3000`) → constante; quitar el error por falta de `NEXT_PUBLIC_API_URL`
- [x] 1.4 En el script, rechazar con un mensaje claro una `NEXT_PUBLIC_API_URL` que no sea `https://` en el build de producción, e indicar al terminar si se usó el servidor por defecto

## 2. Pruebas

- [x] 2.1 Tests de `defaultServerUrl()` en `tests/unit/platform/server-store.test.ts`: móvil con variable, móvil sin variable (Vercel), web sin variable (vacío)
- [x] 2.2 Test que lee `default-server.ts` con la misma expresión regular que el script y comprueba que da una URL `https://`
- [x] 2.3 Ejecutar `npm test`, `npm run typecheck` y `npm run lint` sin fallos

## 3. Documentación

- [x] 3.1 `README.md` (sección App Android): `npm run build:mobile` ya apunta a Vercel; `NEXT_PUBLIC_API_URL` solo para otro servidor
- [x] 3.2 `docs/08-despliegue-vercel.md` §8.7: el comando por defecto y la sustitución por otra URL
- [x] 3.3 `docs/04-historias-usuario.md` (HU-16) y `docs/05-tickets.md`: añadir el criterio y el ticket del servidor por defecto

## 4. Verificación

- [x] 4.1 Ejecutar `npm run build:mobile` sin variable y comprobar que termina e imprime el servidor de Vercel
- [ ] 4.2 Generar el APK (`npm run android:apk`), instalarlo en el móvil y comprobar que inicia sesión y lista temas contra Vercel sin cable ni PC
