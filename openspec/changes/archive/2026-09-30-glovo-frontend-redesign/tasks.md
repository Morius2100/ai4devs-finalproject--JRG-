## 1. Base del sistema visual

- [x] 1.1 Leer en `node_modules/next/dist/docs/` la guía de `next/font` y confirmar la API de fuentes de Google en esta versión de Next.js (TKT-001)
- [x] 1.2 Sustituir Geist por Nunito (400–800) con `next/font/google` en `src/app/layout.tsx`, exponiéndola como `--font-sans` y aplicando `font-sans`, `bg-surface` y `text-ink` al `body` (TKT-001)
- [x] 1.3 Reescribir `src/app/globals.css`: variables de color de marca en `:root` (`--brand-yellow` #FFC244, `--brand-green` #017963, `--brand-green-strong` #035949, `--brand-green-soft` #E0F0ED, `--surface`, `--surface-muted` #F2F2F3, `--ink` #161617, `--ink-muted`, `--line`), su redefinición en modo oscuro, `@theme inline` que las exponga como colores de Tailwind y eliminar `font-family: Arial` (TKT-001)
- [x] 1.4 Añadir en `globals.css` las utilidades `btn-primary`, `btn-secondary` y `field` (píldora, mínimo 44 px de alto, foco visible verde) y un estilo `focus-visible` global (TKT-001)
- [x] 1.5 Pruebas: `npm run typecheck`, `npm run lint` y comprobación en el navegador de que la fuente se sirve desde el propio origen y que el modo oscuro cambia fondo y texto (escenarios "Fuente cargada sin terceros" y "Preferencia de modo oscuro")

## 2. Cabecera, buscador y lista de temas

- [x] 2.1 Rediseñar `src/components/MainMenu.tsx`: fondo `brand-yellow`, logotipo "Opina" en negrita verde de marca, botón de menú circular con icono SVG en línea y menú desplegable como tarjeta `rounded-2xl` con opciones de 44 px, sin cambiar sus opciones ni su comportamiento (TKT-008)
- [x] 2.2 Rediseñar `src/components/topics/SearchBar.tsx`: continuar el fondo amarillo bajo la cabecera con borde inferior `rounded-b-3xl` y campo blanco en píldora con icono de lupa, conservando `sticky`, debounce y `?q=` (TKT-014)
- [x] 2.3 Rediseñar `src/components/topics/TopicListItem.tsx` como tarjeta `rounded-2xl`: miniatura de 64 px con `next/image` (`sizes="64px"`) o marcador verde claro con la inicial del título, título en negrita con máximo 2 líneas y chip "N votos" (singular "1 voto") (TKT-013)
- [x] 2.4 Adaptar `src/components/topics/TopicList.tsx`: lista de tarjetas con separación (`gap`) y márgenes laterales en lugar de `divide-y`, y estados de carga, vacío y error con el nuevo estilo (TKT-013)
- [x] 2.5 Pruebas: añadir tests unitarios de `TopicListItem` (con imagen muestra miniatura y "12 votos"; sin imagen muestra la inicial; enlaza a `/temas/[id]`) y ejecutar los tests existentes de descubrimiento (escenarios "Cabecera con color de marca", "Buscador en píldora", "Tema con imagen en la lista", "Tema sin imagen en la lista" y "Área táctil de la tarjeta")

## 3. Pantalla de tema y votación

- [x] 3.1 Rediseñar `src/components/topics/TopicView.tsx`: contenido bajo la imagen sobre una hoja con esquinas superiores redondeadas que solapa como máximo 16 px, sin reducir el `h-[50dvh]` de `TopicImage`, y título más grande en negrita (TKT-017)
- [x] 3.2 Rediseñar `src/components/topics/VoteButtons.tsx`: dos píldoras grandes `green-600` / `red-600` en un pie fijo con margen, conservando `aria-label` e iconos (TKT-017)
- [x] 3.3 Rediseñar `src/components/topics/VoteResults.tsx`: barra de proporción verde/rojo con los dos totales y destacado del voto propio (TKT-022)
- [x] 3.4 Rediseñar `src/components/topics/JustificationDialog.tsx`: hoja inferior `rounded-t-3xl` en móvil, `textarea` con estilo `field`, "Cancelar" como `btn-secondary` y "Votar" en píldora verde o roja según el voto, sin tocar foco, `Esc` ni validaciones (TKT-021)
- [x] 3.5 Rediseñar `src/components/topics/OpinionItem.tsx` y `OpinionList.tsx` como tarjetas `rounded-2xl` que conservan `border-green-600` / `border-red-600` y el icono del voto (TKT-022)
- [x] 3.6 Rediseñar `src/app/temas/[id]/not-found.tsx` con el nuevo estilo y el enlace de vuelta como `btn-primary` (TKT-017)
- [x] 3.7 Pruebas: ejecutar `OpinionItem.test.tsx`, los tests de votación y `tests/e2e/votacion.spec.ts`, y comprobar a 390 × 844 px que la imagen mide 422 px de alto (escenarios "Botones de voto tras el rediseño" y "Opinión en contra" y requisito de imagen de `detalle-tema`)

## 4. Formularios y notificaciones

- [x] 4.1 Rediseñar `src/app/(auth)/layout.tsx`: bloque superior amarillo con el logotipo "Opina" y el formulario en una tarjeta blanca redondeada (TKT-007)
- [x] 4.2 Aplicar `field` y `btn-primary` en `src/app/(auth)/login/page.tsx` y `src/app/(auth)/registro/page.tsx`, con enlaces secundarios en verde de marca y mensajes de error sin cambios de texto (TKT-007)
- [x] 4.3 Rediseñar `src/app/(main)/temas/nuevo/page.tsx`: campos `field`, visibilidad como control segmentado en píldora (los radios siguen siendo accesibles), selector de imagen como zona redondeada y botón `btn-primary` (TKT-026)
- [x] 4.4 Rediseñar `src/components/notifications/NotificationItem.tsx`, `NotificationList.tsx` y `src/app/(main)/notificaciones/page.tsx` como tarjetas con icono circular verde claro, y estados vacío y de error con el nuevo estilo (TKT-031)
- [x] 4.5 Pruebas: ejecutar los tests de identificación, creación de temas y notificaciones (unitarios, de integración y e2e) y comprobar que el botón de envío de login, registro y crear tema es una píldora verde con texto blanco (escenario "Acción principal destacada")

## 5. Verificación final

- [x] 5.1 Ejecutar `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test` y `npm run test:e2e` sin errores (TKT-009)
- [x] 5.2 Revisión visual con la aplicación en marcha en `localhost:3000`, a 375 px de ancho y en escritorio, en modo claro y oscuro, de todas las pantallas: login, registro, principal, búsqueda, tema sin votar y votado, crear tema, notificaciones y tema no encontrado (TKT-008)
- [x] 5.3 Pruebas: recorrer la pantalla principal con Tab comprobando el foco visible y verificar el contraste de texto sobre amarillo, sobre verde de marca y en modo oscuro (≥ 4.5:1) (escenario "Navegación con teclado" y requisito de accesibilidad)
