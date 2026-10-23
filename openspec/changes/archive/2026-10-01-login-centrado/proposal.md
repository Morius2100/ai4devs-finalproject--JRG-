## Why

En `/login` y `/registro`, la tarjeta del formulario se monta sobre la parte inferior de la cabecera amarilla porque `AuthLayout` (`src/app/(auth)/layout.tsx`) le aplica un margen negativo (`-mt-8`). Además queda pegada arriba en lugar de centrada. En pantallas de móvil altas deja un gran hueco vacío debajo y da sensación de desalineada.

## What Changes

- La cabecera amarilla con el logotipo se mantiene arriba.
- La tarjeta del formulario deja de solapar la cabecera.
- La tarjeta se centra en horizontal y en vertical dentro del espacio que queda bajo la cabecera, en `/login` y en `/registro`.
- Si el contenido no cabe (pantalla baja o teclado abierto), la pantalla se desplaza con normalidad, sin que la tarjeta tape la cabecera ni se corte.
- El cambio se aplica igual en la web y en la app Android.

## Capabilities

### New Capabilities
<!-- Ninguna. -->

### Modified Capabilities
- `identidad-visual`: nuevo requisito sobre la disposición de las pantallas de identificación (cabecera sin solape y tarjeta centrada).

## Impact

- **Código:** `src/app/(auth)/layout.tsx`, solo clases de maquetación. No cambian los formularios ni su lógica.
- **Pruebas:** nueva prueba E2E de disposición en `/login` y `/registro` con el viewport móvil de Playwright (390 × 844).
- **Documentación:** ticket TKT-049 en `docs/05-tickets.md`.
