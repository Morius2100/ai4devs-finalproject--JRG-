## Context

La amistad se guarda simétrica, en dos filas de `friendships`, y se crea con `FriendshipService.add`, sin consentimiento de la otra persona. `VisibilityPolicy.canAccessAsync` decide el acceso a un tema privado con «autor o amigo del autor», así que **quien crea una amistad obtiene el acceso**. `StoryService` (historias de 24 h) y `NotificationService` leen las mismas filas. El resultado es que la confidencialidad de un tema privado depende de que nadie añada al lector indebido, y cualquiera puede hacerlo. El proyecto ya lo había anotado como Q-04 sin resolver.

Lo que sí está bien resuelto (ver el informe): 404 uniforme para temas privados ajenos, consultas parametrizadas, email y hash nunca expuestos, `deny by default` en el middleware, CORS restringido a los orígenes de la app, subida de imágenes con tipo y tamaño comprobados.

## Goals / Non-Goals

**Goals:**
- Que solo se pueda ver el contenido privado de alguien con su consentimiento.
- Cambiar lo mínimo: `VisibilityPolicy`, `StoryService` y `NotificationService` no cambian.
- Cerrar los hallazgos S-02 a S-09 con medidas proporcionadas a un MVP.

**Non-Goals:**
- Bloquear o denunciar usuarios, moderación, recuperación de contraseña y notificaciones de solicitudes por email o push (siguen fuera del producto).
- Cifrado de extremo a extremo o auditoría de seguridad externa.

## Decisions

1. **Solicitud y aceptación (Opción A, recomendada).** Una tabla nueva `friend_requests (requester_id, addressee_id, created_at)` con `UNIQUE (requester_id, addressee_id)` y `CHECK (requester_id <> addressee_id)`. Al aceptar, y en una transacción, se borra la solicitud y se insertan las dos filas de `friendships`. `friendships` conserva su significado («amistad aceptada»).
   - *Alternativa B:* una columna `status` en `friendships`. Descartada: obliga a filtrar `status = 'ACCEPTED'` en todas las consultas de acceso (`VisibilityPolicy`, `StoryService`, `NotificationService`, `UserService`); olvidar una filtra datos.
   - *Alternativa C:* dejarlo como está y avisar al usuario. Descartada: la confidencialidad de los temas privados queda anulada.
   - *Alternativa D:* acceso solo si la amistad es mutua y antigua (retardo). Descartada: complica sin dar consentimiento real.
2. **Si ya existe una solicitud en sentido contrario, la nueva solicitud la acepta** (ambos quieren ser amigos). Evita solicitudes cruzadas.
3. **Las solicitudes se ven en la pantalla de personas** (pestaña o sección «Solicitudes») y reutilizan el patrón de lista con cursor. No se notifica fuera de la app.
4. **Límite de intentos con almacén compartido (implementado).** En Vercel (funciones sin estado) un contador en memoria no sirve. Se usa Postgres, que ya existe: tabla `rate_limits (key, window_start, count)` con **ventana fija** y un único `INSERT … ON CONFLICT` atómico (`src/server/rate-limit.ts`). Se descartó la ventana deslizante por simplicidad: permite hasta el doble del límite en el cambio de ventana. Upstash Redis queda como alternativa si el volumen crece. Claves: IP+hash del email (10 por minuto) y solo IP (60 por minuto) para login web y token de la app, IP para registro (20 por hora) y usuario para solicitudes de amistad (30 por hora). Se cuentan los intentos, no solo los fallos, para no depender del resultado. El email se guarda como hash. Con `RATE_LIMIT_DISABLED=1` se desactiva (solo para los e2e). La IP sale de `x-forwarded-for`, que en Vercel pone la plataforma.
5. **Imágenes de temas privados con URL firmada de corta vida** (HMAC con `AUTH_SECRET`, caducidad de unos minutos, generada por el servidor solo si `VisibilityPolicy` lo permite). Un `<img>` no envía el `Authorization` de la app, por eso no basta con exigir sesión en `/api/media`. Las imágenes de temas públicos y las fotos de perfil siguen siendo públicas y cacheables.
6. **Seed protegido en el build.** `scripts/vercel-build.mjs` aborta si `RUN_SEED=1` y `VERCEL_ENV=production`, salvo `ALLOW_PRODUCTION_SEED=1` explícito. `prisma/seed.ts` toma la contraseña de una variable y no usa `password123` en producción.
7. **Login sin diferencia de tiempo.** Si el email no existe, se hace igualmente una comparación de bcrypt con un hash ficticio. Se mantiene el mensaje genérico.
8. **Cabeceras** configuradas en `next.config.ts` (`headers()`): `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` y `frame-ancestors 'none'`. En la app Android (exportación estática) se aplican las equivalentes en `capacitor.config.ts`.

## Risks / Trade-offs

- [El flujo de solicitud añade pasos al usuario] → Mantener «Añadir a amigos» en el perfil, que ahora envía la solicitud, y mostrar el estado «Solicitud enviada».
- [Migrar amistades existentes] → Las filas actuales de `friendships` se consideran aceptadas; no se revoca nada. Se documenta que las amistades creadas sin consentimiento antes del cambio permanecen.
- [CSP demasiado estricta rompe Next.js o Capacitor] → Probar en la web desplegada y en la APK; empezar con `Content-Security-Policy-Report-Only`.
- [Límite de intentos bloquea a usuarios legítimos detrás de una IP compartida] → Umbrales holgados y mensaje claro con `Retry-After`.
- [Las URL firmadas cambian en cada carga y rompen la caché del navegador] → Solo afecta a imágenes de temas privados.

## Migration Plan

1. Migración Prisma que crea `friend_requests` (y `rate_limits` si se usa Postgres). No toca `friendships`.
2. Desplegar la API con los endpoints nuevos y `PUT /friendship` convertido en «enviar solicitud».
3. Desplegar la interfaz. Hasta entonces el botón antiguo sigue funcionando, porque la API conserva la ruta.
4. Rollback: revertir el despliegue; la tabla nueva puede quedarse sin uso.

## Open Questions

- ~~**Q-04:**~~ **Resuelta**: se acepta la solicitud y aceptación de amistad (8 de noviembre de 2026).
- ~~¿Basta con la sesión de 30 días sin revocación (S-07)?~~ **Resuelta**: sí en este MVP; se acepta el riesgo y se revisará si se añade cambio de contraseña (entonces, `sessionVersion` por usuario). Detalle en `docs/09-revision-seguridad.md`.
- ~~¿Se acepta que el registro revele si un nombre de usuario o email ya existe (S-04)?~~ **Resuelta**: sí. El nombre de usuario es público y el registro está limitado a 20 por hora y por IP; el login sí es uniforme.
