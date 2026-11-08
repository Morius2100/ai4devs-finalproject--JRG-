> Origen: **Revisión 1 de LIDR, tarea T6** y la revisión de seguridad ([docs/09-revision-seguridad.md](../../../docs/09-revision-seguridad.md)). Los tickets TKT-0xx de la columna «Relacionado» son los existentes que se modifican; los nuevos tickets se numeran al aplicar el change. **Q-04 resuelta el 8 de noviembre de 2026: se aceptan las solicitudes de amistad.** Queda pendiente la implementación (grupos 2 a 5).

## 1. Decisión de producto y documentación

- [x] 1.1 Decidir Q-04: aceptar solicitud y aceptación de amistad (Opción A del design) y quitarla de «No forman parte del producto» en `docs/01-producto.md` §5 (Relacionado: TKT-036, S-01)
- [x] 1.2 Actualizar `docs/01-producto.md` (S-02 y Q-01/Q-04), `docs/04-historias-usuario.md` (HU-15, CA-15.1 y nuevos criterios de aceptación y rechazo) y `docs/05-tickets.md` con los tickets nuevos (S-01)
- [x] 1.3 Actualizar `docs/02-arquitectura.md` (endpoints de solicitudes y política de acceso) y `docs/03-modelo-datos.md` (tabla `friend_requests` y, si procede, `rate_limits`) (S-01, S-03)
- [x] 1.4 Revisar el README de entrega (§1.2 supuesto «Relación de amistad», §2.5 Seguridad, §4 API) y repetir la copia a `AI4Devs-finalproject` (T2)
- [x] 1.5 Verificar que cada requisito de las specs tiene su criterio en las historias y que `openspec validate amistades-y-confidencialidad --strict` pasa

## 2. Amistad con consentimiento (S-01, crítico)

- [x] 2.1 Migración Prisma: tabla `friend_requests` con `UNIQUE (requester_id, addressee_id)`, `CHECK (requester_id <> addressee_id)` e índice por `addressee_id` (Relacionado: TKT-003, TKT-028)
- [x] 2.2 `FriendshipService`: `request`, `accept`, `reject`, `cancel` y `listIncoming`. `accept` crea las dos filas de `friendships` y borra la solicitud en una transacción; la solicitud cruzada se acepta sola (Relacionado: TKT-036)
- [x] 2.3 Endpoints: `PUT /api/users/:id/friendship` pasa a enviar solicitud (responde `status: PENDING | FRIENDS`), `DELETE` cancela o deshace, y nuevos `GET /api/me/friend-requests`, `POST /api/me/friend-requests/:id/accept` y `DELETE …/:id` (`:id` es el id de quien envió la solicitud) (Relacionado: TKT-036, TKT-060)
- [x] 2.4 Interfaz: estados «Añadir a amigos», «Solicitud enviada» y «Amigos» en `FriendToggle`, y sección «Solicitudes» en la pantalla de personas con aceptar y rechazar, accesibles (Relacionado: TKT-034, TKT-035)
- [x] 2.5 Migración de datos: confirmar que las filas actuales de `friendships` siguen siendo amistades aceptadas y que `VisibilityPolicy`, `StoryService` y `NotificationService` no cambian
- [x] 2.6 Pruebas unitarias y de integración de los escenarios de la spec `amistades` (pendiente sin acceso por detalle, perfil, historias y notificaciones; aceptar, rechazar y cancelar; solicitud cruzada; aceptar una solicitud ajena → `404`). Verificado el 8 de noviembre de 2026 en PostgreSQL local con la migración aplicada: 196 de integración y 247 unitarias en verde
- [x] 2.7 Actualizar los e2e que daban por inmediata la amistad (`tests/e2e/personas-amistades.spec.ts`, `historias.spec.ts` y `mi-perfil.spec.ts`): quien solicita ve «Solicitud enviada» y la otra persona debe aceptar desde Personas; cubre solicitud pendiente sin acceso, aceptar, cancelar y rechazar. Verificado el 8 de noviembre de 2026 en local: 40 de 41 e2e en verde; el que falla (`descubrimiento-temas.spec.ts:88`) busca los botones de voto en un tema que `ana` ya había votado en la base local y no depende de las amistades

## 3. Límite de intentos y cuentas (S-03, S-04, S-09)

- [x] 3.1 Elegir el almacén del límite (Postgres o Upstash) y crear `rate-limit` con ventana deslizante y clave por IP o por usuario (Relacionado: TKT-008)
- [x] 3.2 Aplicarlo a login web, `POST /api/auth/token`, `POST /api/register` y solicitudes de amistad, con `429` y `Retry-After` (Relacionado: TKT-006, TKT-042)
- [x] 3.3 `AuthService.verifyCredentials`: comparar con un hash ficticio si el email no existe (Relacionado: TKT-006)
- [x] 3.4 `registerSchema`: `password` con máximo de 72 caracteres y mensaje claro (Relacionado: TKT-006)
- [x] 3.5 Pruebas: los escenarios de «Limitación de intentos», «Inicio de sesión sin pistas» y «Longitud acotada» de la spec `confidencialidad-usuarios`

## 4. Imágenes, seed y cabeceras (S-02, S-05, S-06)

- [x] 4.1 `scripts/vercel-build.mjs`: abortar con `RUN_SEED=1` y `VERCEL_ENV=production` sin `ALLOW_PRODUCTION_SEED=1`; `prisma/seed.ts`: contraseña desde variable fuera de local (Relacionado: `docs/08-despliegue-vercel.md`)
- [ ] 4.2 Comprobar en el entorno desplegado si el seed se ejecutó en producción; si es así, cambiar o eliminar las cuentas `ana`, `bruno`, `carla` y `dani` y los temas de demostración (S-02)
- [x] 4.3 `/api/media`: URLs firmadas con caducidad para imágenes de temas privados; `404` sin firma válida; temas públicos y avatares sin cambios (Relacionado: TKT-067)
- [x] 4.4 `next.config.ts`: cabeceras de seguridad, primero con CSP en modo `Report-Only` y después aplicada; equivalente para la APK (Relacionado: TKT-046)
- [x] 4.5 Pruebas: los escenarios de «Imágenes protegidas», «Credenciales de prueba» y «Cabeceras» (incluido el flujo completo sin violaciones de CSP en la web desplegada)

## 5. Sesiones (S-07, S-08) y cierre

- [x] 5.1 Decidir si hace falta revocar sesiones (contador de versión por usuario) y, si se acepta el riesgo, documentarlo en `docs/09-revision-seguridad.md`
- [x] 5.2 Quitar `trustHost: true` o actualizar su comentario, que dice «no Vercel», y fijar `AUTH_URL` en producción (Relacionado: TKT-006)
- [x] 5.3 Actualizar `docs/09-revision-seguridad.md` con el estado de cada hallazgo (cerrado, aceptado o pendiente) y volver a pasar las pruebas completas (`npm run lint && npm run typecheck && npm test && npm run test:e2e`)
