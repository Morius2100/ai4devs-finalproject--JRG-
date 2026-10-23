## 1. Documentación

- [x] 1.1 Añadir el ticket TKT-049 «Pantallas de identificación centradas» (FE, HU-00, 1 pt, cambio `login-centrado`) al resumen y al detalle de `docs/05-tickets.md` (TKT-049).
- [x] 1.2 Pruebas: `openspec validate login-centrado --strict` sin errores (TKT-049).

## 2. Maquetación de las pantallas de identificación

- [x] 2.1 En `src/app/(auth)/layout.tsx` (TKT-049):
  - la raíz pasa a `flex min-h-dvh flex-1 flex-col`;
  - la cabecera cambia `pb-16` por `pb-10`;
  - el contenedor de la tarjeta pierde `-mt-8` y pasa a `flex flex-1 items-center justify-center px-4 py-8`.
- [x] 2.2 Comprobar a mano en el navegador (390 × 844 y 390 × 500) que `/login` y `/registro` no solapan la cabecera y que el botón de envío es accesible con el teclado abierto (TKT-049).
- [x] 2.3 Pruebas: crear `tests/e2e/identificacion-disposicion.spec.ts` con los escenarios del requisito «Pantallas de identificación centradas» (TKT-049):
  - borde superior de la tarjeta ≥ borde inferior de la cabecera;
  - márgenes superior e inferior con menos de 16 px de diferencia en 390 × 844, en `/login` y `/registro`;
  - en 390 × 500, tarjeta sin solape y botón de envío alcanzable con scroll.

## 3. Verificación

- [x] 3.1 Pruebas: `npm run lint`, `npm run typecheck`, `npm test` y `npm run test:e2e` sin fallos (TKT-049).
- [ ] 3.2 Pruebas: generar la app con `npm run build:mobile:dev` y `npm run android:apk` (con `npm run dev` parado durante el build), instalarla y comprobar en el móvil que la pantalla de login queda centrada y sin solape (TKT-049).
