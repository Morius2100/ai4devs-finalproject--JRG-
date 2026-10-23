## Context

- `src/app/(auth)/layout.tsx` pinta primero una cabecera amarilla (`rounded-b-3xl`, `pb-16 pt-12`) con el logotipo.
- Después pinta un contenedor `-mt-8 flex flex-1 justify-center` con la tarjeta (`max-w-sm`, `h-fit`).
- El margen negativo es lo que monta la tarjeta sobre la cabecera. `justify-center` solo centra en horizontal; en vertical la tarjeta queda arriba.
- `body` es `flex min-h-full flex-col` y `html` tiene `h-full`, así que el layout ya puede ocupar toda la altura con `flex-1`.
- La app Android usa el mismo layout (export estático) con las barras del sistema gestionadas por Capacitor.

## Goals / Non-Goals

**Goals:**
- Tarjeta sin solape con la cabecera y centrada en el espacio restante, en web y app.
- Comportamiento correcto con el teclado virtual abierto y en pantallas bajas.

**Non-Goals:**
- Cambiar el aspecto de la cabecera, del logotipo o de los formularios.
- Centrar la tarjeta respecto a la pantalla completa. Se centra en el hueco bajo la cabecera, que es lo que evita el solape.

## Decisions

### D1. Centrado con flexbox en el hueco restante

- El contenedor de la tarjeta pasa a `flex flex-1 items-center justify-center px-4 py-8` y se elimina `-mt-8`.
- La cabecera conserva su tamaño. Su `pb-16` se reduce a `pb-10`, porque ya no hace falta reservar espacio para el solape.
- `items-center` en un contenedor `flex-1` centra en vertical cuando sobra espacio. Si falta, el contenido crece y la página se desplaza: no hay posicionamiento absoluto que pueda tapar la cabecera.
- *Alternativa:* `position: absolute` con `top: 50%` y `translate`. Descartada porque con el teclado abierto o en pantallas bajas se superpone a la cabecera y recorta el formulario.
- *Alternativa:* centrar respecto a toda la pantalla (`min-h-dvh` con la cabecera superpuesta). Descartada porque vuelve a solapar en móviles bajos.

### D2. Altura dinámica

La raíz del layout usa `min-h-dvh`, no `vh`, como ya hace `TopicImage`. Así la barra del navegador móvil no descuadra el centrado.

## Risks / Trade-offs

- [En pantallas muy altas, la tarjeta queda lejos del logotipo] → Es el comportamiento pedido (centrada). La cabecera sigue identificando la app.
- [Regresión visual en `/registro`, más alto que `/login`] → La prueba E2E cubre las dos pantallas.
