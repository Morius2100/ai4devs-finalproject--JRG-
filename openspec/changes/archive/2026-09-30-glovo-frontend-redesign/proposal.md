## Why

La interfaz de Opina es funcional pero conserva el aspecto de la plantilla de Next.js: fuente Arial, lista de temas como texto plano, botones negros de bordes rectos y sin identidad de marca. Para una aplicación mobile-first de uso rápido y social, este aspecto transmite poco y dificulta distinguir de un vistazo las acciones principales. Se adopta un lenguaje visual inspirado en Glovo (amarillo cálido de marca, acciones en verde, formas en píldora, tipografía redondeada y en negrita), un referente de app móvil de consumo con el que el público objetivo ya está familiarizado.

## What Changes

- Se define un sistema visual propio (tokens de color, tipografía, radios, espaciado) en `globals.css` mediante `@theme` de Tailwind v4, con variante de modo oscuro.
- Se sustituye la tipografía Arial/Geist por una fuente redondeada de Google Fonts cargada con `next/font`.
- Cabecera (`MainMenu`) con fondo amarillo de marca, logotipo textual "Opina" y menú desplegable con estilo de tarjeta.
- Buscador en forma de píldora integrado en la cabecera amarilla de la pantalla principal.
- Lista de temas en forma de tarjetas redondeadas que muestran miniatura (si hay imagen) y número total de votos, datos que la API ya devuelve (`imageUrl`, `totalVotes`).
- Botones de voto, resultados, diálogo de justificación y opiniones con formas redondeadas; se mantiene el significado verde = a favor, rojo = en contra.
- Formularios (login, registro, crear tema) con campos en píldora, botón principal verde de marca y selector de visibilidad segmentado.
- Estados vacíos, de carga, de error y la pantalla "Tema no encontrado" alineados con el nuevo estilo.
- No se añade ninguna funcionalidad ni se cambia el comportamiento, las rutas, la API ni los datos.

## Capabilities

### New Capabilities
- `identidad-visual`: sistema visual común de la interfaz (paleta de marca, tipografía, formas, contraste, modo oscuro y área táctil mínima) aplicado de forma coherente a todas las pantallas.

### Modified Capabilities
<!-- Ninguna: los requisitos existentes (imagen en la mitad superior, botones verde/rojo, opciones del menú, opiniones coloreadas) se conservan tal cual. -->

## Impact

- **Código afectado**: `src/app/globals.css`, `src/app/layout.tsx`, layouts de `(main)`, `(auth)` y `temas/[id]`, todos los componentes de `src/components/` y las páginas de login, registro, crear tema, notificaciones y "no encontrado".
- **Dependencias**: ninguna nueva en npm; se añade una fuente de Google Fonts vía `next/font/google` (se descarga en build y se sirve desde el propio dominio).
- **Tests**: los tests que comprueban clases (`border-green-600` en `OpinionItem`) deben seguir pasando o actualizarse; los tests por rol/etiqueta accesible no deberían verse afectados.
- **API, base de datos y servicios**: sin cambios.
