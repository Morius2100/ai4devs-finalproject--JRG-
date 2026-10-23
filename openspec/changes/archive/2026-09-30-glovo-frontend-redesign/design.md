## Context

Opina es una aplicación Next.js 15 (App Router) + React 19 + Tailwind CSS v4, mobile-first. Toda la interfaz vive en `src/app` (layouts y páginas) y `src/components` (menú, temas, votación, notificaciones). Estado actual:

- `globals.css` es la plantilla de `create-next-app`: dos variables (`--background`, `--foreground`) y `font-family: Arial` en `body`, que anula la fuente Geist cargada en `layout.tsx`.
- Los componentes usan colores sueltos (`black/10`, `bg-black`, `green-600`, `red-600`, `blue-600`) y `rounded-md`.
- La pantalla de un tema (`temas/[id]`) no tiene `MainMenu` a propósito: la imagen debe ocupar la mitad superior (spec `detalle-tema`).
- Hay tests que dependen de clases: `OpinionItem.test.tsx` y `tests/e2e/votacion.spec.ts` comprueban `border-green-600` / `border-red-600`.

Referencia visual analizada en glovoapp.com: cabecera amarilla `#FFC244` con borde inferior curvo, botón principal verde `#017963`, acción secundaria verde claro `#E0F0ED` con texto `#035949`, campos y chips en gris `#F2F2F3`, texto `#161617`, todo en píldora (`border-radius` total), tipografía propia redondeada en negrita y diseño plano casi sin sombras.

## Goals / Non-Goals

**Goals:**
- Dar a Opina una identidad visual reconocible, inspirada en Glovo pero propia (nombre y logotipo de Opina, sin recursos de marca de Glovo).
- Centralizar colores, tipografía y radios en tokens de tema para que todas las pantallas sean coherentes.
- Mejorar la lectura de la lista de temas mostrando datos que la API ya devuelve (miniatura y total de votos).
- Mantener accesibilidad (contraste, foco, 44 px táctiles) y soporte de modo oscuro.

**Non-Goals:**
- Nuevas funcionalidades, pantallas, rutas o cambios de navegación (p. ej. barra inferior de pestañas o botón "volver" en el tema).
- Cambios en API, servicios, base de datos o validaciones.
- Usar la fuente, el logotipo, las ilustraciones o cualquier recurso protegido de Glovo.
- Añadir librerías de componentes o de iconos.

## Decisions

### 1. Tokens en `@theme` de Tailwind v4 con variables CSS
Se definen en `globals.css` variables en `:root` (`--brand-yellow`, `--brand-green`, `--brand-green-strong`, `--brand-green-soft`, `--surface`, `--surface-muted`, `--ink`, `--ink-muted`, `--line`) y se exponen con `@theme inline` como colores de Tailwind (`bg-brand-yellow`, `text-ink`, etc.). El modo oscuro redefine solo las variables bajo `@media (prefers-color-scheme: dark)`.
- *Por qué*: un único sitio para cambiar la paleta; los componentes no necesitan variantes `dark:` para cada color.
- *Alternativa descartada*: clases arbitrarias (`bg-[#FFC244]`) en cada componente — duplicación y sin modo oscuro centralizado.

### 2. Tipografía Nunito vía `next/font/google`
Se sustituye Geist por **Nunito** (pesos 400–800) como `--font-sans`, y se elimina el `font-family: Arial` de `body`.
- *Por qué*: es sans-serif redondeada y muy legible, la más cercana en carácter a Glovo Sans, que es propietaria. `next/font` la descarga en build y la sirve desde el propio dominio (sin peticiones a Google en ejecución).
- *Alternativas*: DM Sans (menos redondeada), mantener Geist (no transmite el tono cercano buscado).

### 3. Utilidades compartidas mínimas con `@utility`
Se crean tres utilidades en `globals.css`: `btn-primary` (píldora verde de marca), `btn-secondary` (píldora verde claro) y `field` (campo en píldora gris con foco verde). El resto se compone con clases de Tailwind en cada componente.
- *Por qué*: botón principal y campos se repiten en login, registro, crear tema y diálogo; así quedan idénticos sin crear componentes React nuevos.
- *Alternativa descartada*: componentes `<Button>`/`<Input>` — más cambios de estructura y de tests para un cambio puramente visual.

### 4. Cabecera amarilla con buscador integrado
`MainMenu` pasa a fondo `brand-yellow`, logotipo "Opina" en negrita verde y botón de menú circular con icono SVG en línea (sustituye al carácter `☰`). En la pantalla principal, `SearchBar` continúa el fondo amarillo con borde inferior redondeado (`rounded-b-3xl`) y el campo blanco en píldora, conservando su comportamiento `sticky`, debounce y sincronización con `?q=`.
- *Por qué*: reproduce el patrón más reconocible de Glovo (hero amarillo + buscador blanco) sin cambiar la estructura de componentes.

### 5. Tarjetas de tema con miniatura y total de votos
`TopicListItem` pasa a tarjeta blanca redondeada (`rounded-2xl`, borde sutil) con: miniatura cuadrada de 64 px (`next/image`, mismo host S3 ya configurado para `TopicImage`) o, si no hay imagen, un cuadrado verde claro con la inicial del título; título en negrita (máx. 2 líneas); chip gris "N votos". La lista pasa de `divide-y` a una columna de tarjetas con `gap`.
- *Por qué*: `imageUrl` y `totalVotes` ya vienen en `TopicSummary`; mostrarlos no añade funcionalidad y hace la lista escaneable como los listados de Glovo.

### 6. Verde/rojo del voto separados del verde de marca
Los botones de voto, resultados, diálogo y opiniones siguen usando `green-600` / `red-600` de Tailwind (mismas clases de borde que hoy), ahora con formas redondeadas: botones de voto como dos píldoras grandes en un pie flotante con margen, resultados con barra de proporción, opiniones como tarjetas `rounded-2xl`.
- *Por qué*: la spec `detalle-tema` exige verde/rojo; conservar las clases mantiene verdes los tests existentes. El verde de marca (`#017963`) se reserva para acciones generales, evitando confundir "acción principal" con "voto a favor".

### 7. Pantalla de tema sin cambios de estructura
Se mantiene sin `MainMenu` y con la imagen en `h-[50dvh]`. Solo cambian el estilo del título (más grande y en negrita) y del bloque inferior; el contenido bajo la imagen se presenta sobre una hoja blanca con esquinas superiores redondeadas que solapa ligeramente la imagen, sin reducir la altura de esta.

## Risks / Trade-offs

- [El solape de la hoja sobre la imagen podría interpretarse como que la imagen ya no ocupa la mitad] → La imagen conserva `h-[50dvh]`; el solape se limita a unos 16 px y se valida en el test/escenario de 844 px de alto.
- [Contraste insuficiente del amarillo] → El amarillo solo se usa como fondo con texto `ink` (≈ 11:1); nunca como color de texto sobre blanco. El blanco sobre verde de marca da ≈ 5.6:1.
- [Tests que dependen de clases] → Se conservan `border-green-600`/`border-red-600` en `OpinionItem`; se ejecutan unit y e2e al final.
- [Miniaturas remotas en la lista aumentan peso] → `next/image` con `sizes="64px"` sirve versiones reducidas; carga diferida por defecto.
- [Parecido excesivo con una marca registrada] → Se toma solo el lenguaje visual general (paleta cálida, formas en píldora); nombre, logotipo, tipografía e ilustraciones son propios de Opina.

## Migration Plan

Cambio puramente de presentación, desplegable en un único paso. Reversión: revertir el commit; no hay migraciones de datos ni cambios de API.

## Open Questions

- Ninguna bloqueante. Si más adelante se quiere un logotipo gráfico para Opina, sustituiría al logotipo textual de la cabecera sin afectar al resto del diseño.
