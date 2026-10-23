## 1. Componente del logotipo

- [x] 1.1 Crear `src/components/Logo.tsx` con las constantes de geometría (`MARK_VIEWBOX`, `MARK_RING`, `MARK_TAIL`), `OpinaMark` (SVG con `currentColor`, `aria-hidden`, tamaño por `className`) y `OpinaLogo` (símbolo + "pina" en `font-extrabold`, símbolo a la altura de las mayúsculas, todo `aria-hidden`) (TKT-008)
- [x] 1.2 Pruebas: test unitario de `OpinaLogo` (renderiza un SVG y el texto "pina", ambos ocultos a tecnologías de asistencia, y hereda `currentColor`) (escenarios "Logotipo en la cabecera" y "Nombre accesible del logotipo")

## 2. Uso en la interfaz

- [x] 2.1 Sustituir en `src/components/MainMenu.tsx` el texto "Opina" por `OpinaLogo`, manteniendo `href="/"`, `text-on-yellow` y un área táctil ≥ 44 px, y añadir `aria-label="Opina"` al `Link` (TKT-008)
- [x] 2.2 Sustituir en `src/app/(auth)/layout.tsx` el texto del `h1` por `OpinaLogo` a mayor tamaño, centrado, con `<span className="sr-only">Opina</span>` dentro del `h1` (TKT-007)
- [x] 2.3 Pruebas: ejecutar `tests/e2e/identificacion.spec.ts` (enlace "Opina" visible en la cabecera) y comprobar en el navegador, a 375 px y en modo claro y oscuro, la cabecera principal y las pantallas de login y registro (escenarios "Logotipo en la cabecera" y "Logotipo en las pantallas de identificación")

## 3. Iconos de la aplicación

- [x] 3.1 Crear `src/app/icon.svg` (`viewBox 0 0 96 96`, cuadrado verde `#035949` con `rx=22` y el símbolo amarillo `#FFC244` centrado) y eliminar `src/app/favicon.ico` (TKT-001)
- [x] 3.2 Crear `src/app/apple-icon.tsx` con `size` 180 × 180, `contentType` `image/png` y `ImageResponse` de `next/og`, reutilizando las constantes de `Logo.tsx` (TKT-001)
- [x] 3.4 Excluir `apple-icon` del `matcher` de `src/middleware.ts` para que se sirva sin sesión (TKT-008)
- [x] 3.3 Pruebas: comprobar en el HTML servido que existen `<link rel="icon" ... type="image/svg+xml">` y `<link rel="apple-touch-icon">`, y que `/icon.svg` responde SVG y `/apple-icon` responde PNG de 180 × 180 (escenarios "Favicon de la aplicación" e "Icono de pantalla de inicio")

## 4. Verificación final

- [x] 4.1 Ejecutar `npm run typecheck`, `npm run lint`, `npx prettier --check src tests`, `npm test` y `npm run test:e2e` sin errores (TKT-009)
- [x] 4.2 Pruebas: ejecutar `npm run build` para confirmar que las rutas de metadatos (`icon.svg`, `apple-icon`) se generan sin errores en producción (TKT-009)
