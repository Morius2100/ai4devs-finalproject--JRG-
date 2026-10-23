## Why

Opina no tiene logotipo: la cabecera y las pantallas de login y registro muestran el nombre en texto, y la pestaña del navegador enseña el favicon por defecto de la plantilla de Next.js. De las cinco propuestas presentadas se ha elegido la 3, "La O que habla": la inicial de Opina convertida en bocadillo de diálogo. Es un símbolo sencillo, reconocible a cualquier tamaño y coherente con la identidad visual (amarillo y verde de marca) definida en `identidad-visual`.

## What Changes

- Nuevo logotipo de Opina en dos formas:
  - **Símbolo**: la "O" como anillo con cola de bocadillo.
  - **Logotipo completo**: el símbolo seguido de "pina", leído como "Opina".
- La cabecera (`MainMenu`) muestra el logotipo completo en lugar del texto "Opina". El enlace a la pantalla principal conserva su nombre accesible "Opina".
- Las pantallas de login y registro muestran el logotipo completo en su cabecera amarilla.
- Iconos de la aplicación:
  - Favicon en SVG: símbolo amarillo sobre cuadrado verde redondeado.
  - Icono para la pantalla de inicio de iOS (`apple-icon`, 180 × 180 px).
  - **BREAKING (menor)**: se elimina `src/app/favicon.ico` de la plantilla de Next.js.
- No cambian funcionalidades, rutas, API ni datos.

## Capabilities

### New Capabilities
<!-- Ninguna. -->

### Modified Capabilities
- `identidad-visual`: se añade el requisito del logotipo de Opina (forma, colores, uso en la cabecera y en las pantallas de identificación, iconos de la aplicación y nombre accesible).

## Impact

- **Código afectado**:
  - Nuevo componente `src/components/Logo.tsx`.
  - `src/components/MainMenu.tsx` y `src/app/(auth)/layout.tsx`.
  - Nuevos `src/app/icon.svg` y `src/app/apple-icon.tsx`.
  - Se elimina `src/app/favicon.ico`.
- **Tests**: el e2e que localiza el enlace de la cabecera por el nombre "Opina" debe seguir pasando. Se añade un test unitario del logotipo.
- **Dependencias**: ninguna nueva. `ImageResponse` viene incluido en Next.js (`next/og`).
- **API, servicios y base de datos**: sin cambios.
