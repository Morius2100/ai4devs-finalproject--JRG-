## Context

- La cabecera (`src/components/MainMenu.tsx`) muestra `<Link href="/">Opina</Link>` en texto `text-on-yellow` sobre `bg-brand-yellow`. El token `on-yellow` vale verde oscuro `#035949` en modo claro y casi negro `#161617` en modo oscuro.
- Las pantallas de identificación (`src/app/(auth)/layout.tsx`) muestran `<h1>Opina</h1>` en la misma franja amarilla.
- `src/app/favicon.ico` es el icono por defecto de `create-next-app`; `public/` está vacío y no hay manifiesto ni `apple-icon`.
- `tests/e2e/identificacion.spec.ts` localiza el enlace de la cabecera con `getByRole("link", { name: "Opina", exact: true })`.
- La versión instalada es Next.js 15.5 y no incluye `node_modules/next/dist/docs/`. Se usan las convenciones de archivos de metadatos del App Router (`icon.*`, `apple-icon.*`), que en esta versión generan automáticamente las etiquetas `<link rel="icon">` y `<link rel="apple-touch-icon">`. Durante la implementación se comprueba en el HTML servido.

Geometría del símbolo, tal como se presentó en la propuesta 3, con `viewBox 0 0 60 64`:
- Anillo: `circle cx=30 cy=28 r=22`, trazo de 11.
- Cola: triángulo `M12 42 L5 60 L26 48`.

## Goals / Non-Goals

**Goals:**
- Un único origen de la geometría del logotipo, reutilizado en la cabecera, en las pantallas de identificación y en los iconos.
- Logotipo nítido a cualquier tamaño y adaptado al modo oscuro sin duplicar recursos.
- Mantener el nombre accesible "Opina" y los tests existentes.

**Non-Goals:**
- Manifiesto web / PWA, iconos Android de varios tamaños o pantallas de carga.
- Cambiar el título del documento, los colores de marca o la tipografía.
- Imágenes Open Graph para compartir en redes.

## Decisions

### 1. Componente React con SVG en línea y `currentColor`
`src/components/Logo.tsx` exporta:
- `OpinaMark`: solo el símbolo. SVG con `fill`/`stroke="currentColor"` y `aria-hidden`.
- `OpinaLogo`: `OpinaMark` más el texto "pina" en `font-extrabold`, alineados en su línea base visual. El símbolo mide la altura de las mayúsculas del texto.

El color lo pone el contenedor (`text-on-yellow`).
- *Por qué*: con `currentColor` el logotipo sigue al token `on-yellow` en modo claro y oscuro sin tener dos archivos. En línea, no añade ninguna petición de red.
- *Alternativa descartada*: SVG en `public/` con `<img>`. No hereda el color y obliga a tener una versión por tema.

### 2. Nombre accesible en el contenedor, contenido oculto
En la cabecera, el `Link` lleva `aria-label="Opina"` y todo su contenido va con `aria-hidden`. En la pantalla de identificación, el `h1` contiene el logotipo (`aria-hidden`) y un `<span className="sr-only">Opina</span>`.
- *Por qué*: el texto visible es "pina" y un lector de pantalla leería "pina" u "O pina". Así se cumple el escenario "Nombre accesible del logotipo" y el e2e sigue encontrando el enlace "Opina".

### 3. Favicon como `src/app/icon.svg` estático
SVG de `viewBox 0 0 96 96`: cuadrado `rx=22` en verde `#035949` y el símbolo en amarillo `#FFC244`, escalado y centrado como en el icono presentado. Se elimina `src/app/favicon.ico`.
- *Por qué*: los navegadores modernos aceptan favicon en SVG y se ve nítido en pantallas de alta densidad. Si se mantiene `favicon.ico`, algunos navegadores lo siguen prefiriendo y mostrarían el icono de Next.js.
- *Coste*: navegadores muy antiguos sin soporte de favicon SVG no mostrarán icono. Se acepta.

### 4. `apple-icon` generado con `ImageResponse`
`src/app/apple-icon.tsx` exporta `size = { width: 180, height: 180 }`, `contentType = "image/png"` y una función que devuelve `new ImageResponse(...)` de `next/og`. Dibuja un `div` verde a pantalla completa y dentro el SVG del símbolo en amarillo.
- *Por qué*: iOS no admite SVG como icono de pantalla de inicio. Generarlo evita guardar un PNG binario sin fuente editable y reutiliza la misma geometría.
- *Alternativa descartada*: un PNG exportado a mano. No hay herramienta de exportación en el proyecto y se desincronizaría del SVG.

### 5. Geometría compartida
Las coordenadas del anillo y la cola se definen una sola vez en `Logo.tsx`: constantes `MARK_VIEWBOX`, `MARK_RING` y `MARK_TAIL`. `apple-icon.tsx` las importa. `icon.svg`, al ser un archivo estático, las repite, y un comentario en `Logo.tsx` indica que hay que mantenerlos sincronizados.

## Risks / Trade-offs

- [`ImageResponse` en `next/og` podría no admitir algún elemento SVG] → Solo se usan `circle` y `path` con relleno y trazo, que son compatibles. Se verifica pidiendo `/apple-icon` y comprobando que devuelve un PNG de 180 × 180.
- [En modo oscuro, `on-yellow` pasa a casi negro sobre el amarillo apagado] → Es el mismo contraste que ya tiene el nombre en texto (≥ 7:1). El logotipo lo hereda.
- [Nombre visible "pina" en herramientas que ignoran `aria-label`] → El `title` del documento sigue siendo "Opina". El texto real queda en `sr-only` en el `h1` de las pantallas de identificación.

## Migration Plan

Despliegue en un paso. Los navegadores guardan el favicon en caché, así que el nuevo puede tardar en verse sin forzar la recarga. Reversión: restaurar `favicon.ico` y revertir los componentes.

## Open Questions

- Ninguna bloqueante.

## Ajuste descubierto durante la implementación

`src/middleware.ts` redirige a `/login` cualquier ruta sin sesión que no termine en `.svg/.png/...`. `/apple-icon` no tiene extensión, así que un dispositivo iOS sin cookies recibía la página de login en lugar de la imagen. Se añade `apple-icon` a las exclusiones del `matcher` (junto a `favicon.ico`). `/icon.svg` ya estaba excluido por su extensión.
