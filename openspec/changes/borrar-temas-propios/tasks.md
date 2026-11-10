> Origen: petición del propietario de poder **borrar temas publicados**, solo los propios y solo desde el detalle del tema. Cada tarea cita la historia **HU-23** (nueva); los tickets `TKT-0xx` nuevos se numeran al aplicar el change (siguiente libre: TKT-087). Sin migración de base de datos.

## 1. Decisión de producto y documentación

- [x] 1.1 `docs/01-producto.md`: quitar «borrado» de «No forman parte del producto» (editar un tema sigue fuera) y describir el borrado propio desde el detalle (HU-23)
- [x] 1.2 `docs/04-historias-usuario.md`: añadir **HU-23 · Borrar un tema mío** (CA-23.1 a CA-23.8, como en la spec) en una épica nueva y a la tabla de estimaciones; `docs/05-tickets.md`: tickets nuevos (servicio y API, botón y diálogo, pruebas) (HU-23)
- [x] 1.3 `docs/02-arquitectura.md`: endpoint `DELETE /api/topics/:id` y campo `isAuthor` del detalle; `CLAUDE.md`: regla «solo el autor borra su tema; la cascada de la base de datos elimina votos, notificaciones y visitas» (HU-23)
- [x] 1.4 Actualizar el README de entrega (§ API y funcionalidades) y repetir la copia a `AI4Devs-finalproject` (HU-23)

## 2. Servicio y API

- [x] 2.1 `TopicService.getById`: devolver `isAuthor` y añadirlo al tipo `TopicDetail` (HU-23)
- [x] 2.2 `TopicService.delete(id, userId)`: id no UUID → `NotFoundError`; `deleteMany({ where: { id, authorId: userId } })`, `count === 0` → `NotFoundError`; después `ImageStorage.remove` de mejor esfuerzo con el fallo registrado (HU-23)
- [x] 2.3 `DELETE /api/topics/:id` en `src/app/api/topics/[id]/route.ts`: `requireUser()`, delegar en el servicio, `204`; errores con `toHttpResponse` (HU-23)
- [x] 2.4 Comprobar qué responde `VoteService.castVote` si el tema desaparece entre la lectura y el `INSERT`; si es `500`, traducir el error de clave foránea a `NotFoundError` (HU-23)

## 3. Interfaz

- [x] 3.1 `deleteTopic(topicId)` en `src/lib/api/topics.ts` con `apiFetch` y `DELETE` (HU-23)
- [x] 3.2 Componente `DeleteTopicButton`: botón circular de 44 px con papelera de trazo en rojo, `aria-label="Borrar tema"`, foco visible, con el estilo del resto de la aplicación (HU-23)
- [x] 3.3 Diálogo de confirmación `role="alertdialog"`: «¿Borrar este tema?», aviso de votos y opiniones, foco inicial en «Cancelar», `Esc` cancela, foco atrapado, «Borrando…» y mensaje de error con reintento (HU-23)
- [x] 3.4 `TopicView`: mostrar el botón junto al título solo si `topic.isAuthor`; tras borrar (o `404`) quitar `["topic", id]`, invalidar `["topics"]`, `["user-topics"]`, `["stories"]` y `["notifications"]` y hacer `router.replace("/")` (HU-23)

## 4. Pruebas (cada escenario de las specs tiene su test)

- [x] 4.1 Integración (`tests/integration/topic-delete.test.ts`, necesita PostgreSQL): autor borra y recibe `204`; ajeno recibe `404` y el tema y sus votos siguen; tema privado ajeno `404`; sin sesión `401`; id no UUID o inexistente `404`; borrar dos veces; votos, notificaciones y visitas desaparecen; otros temas intactos (HU-23)
- [x] 4.2 Integración: la imagen se elimina del almacenamiento y un fallo del almacenamiento no impide el borrado (`204`); `isAuthor` verdadero para el autor y falso para otra persona, sin id del autor en la respuesta (HU-23)
- [x] 4.3 Componentes (`tests/unit/components/DeleteTopicButton.test.tsx` y `TopicView`): botón solo con `isAuthor`, cancelar y `Esc` no borran, confirmar llama a la API, error mantiene el diálogo, `404` se trata como borrado, foco inicial en «Cancelar» y trampa de foco (HU-23)
- [x] 4.4 e2e (`tests/e2e/borrar-tema.spec.ts`): el autor crea un tema, lo borra desde el detalle, vuelve a temas, ya no aparece en tendencias ni en su perfil y el enlace muestra «tema no encontrado»; otra persona no ve el botón (HU-23)
- [x] 4.5 Accesibilidad: añadir a `tests/e2e/accesibilidad.spec.ts` el detalle del autor con el botón y el diálogo de borrado abierto, sin infracciones de axe (HU-23)
- [x] 4.6 Medir en el e2e el área táctil (≥ 44 × 44 px) y que el botón no se superpone a la imagen, con y sin imagen (HU-23)

## 5. Cierre

- [x] 5.1 `npm run lint`, `npm run typecheck`, `npm test` y `npm run test:e2e` en verde; `openspec validate borrar-temas-propios --strict` (HU-23)
- [ ] 5.2 Sincronizar con el repositorio de código y el de entrega; recompilar el APK (`npm run build:mobile`) y comprobar el borrado en el móvil (HU-23)
- [ ] 5.3 Archivar el change con `/opsx:archive` para integrar `borrado-temas` y el delta de `detalle-tema` en `openspec/specs/` (HU-23)
