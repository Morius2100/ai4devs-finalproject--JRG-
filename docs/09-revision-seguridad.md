# 09 · Revisión de seguridad y confidencialidad

Revisión de la tarea **T6** de la Revisión 1 de LIDR: se mantiene el sistema de amistades y se comprueba si hay protecciones adecuadas para la confidencialidad de los usuarios. Es una lectura del código y de la documentación (fecha: 8 de noviembre de 2026); **no se han hecho pruebas contra la aplicación desplegada**. Los hallazgos y la conclusión describen el código *antes* de las correcciones; el estado actual de cada uno está en «Estado tras las correcciones». El plan para corregirlo está en el change [`amistades-y-confidencialidad`](../openspec/changes/amistades-y-confidencialidad/tasks.md).

## Conclusión

**Hoy no hay una protección adecuada de la confidencialidad de los temas privados.** El control de acceso en sí está bien hecho, pero depende de la amistad, y la amistad puede crearla cualquiera sin permiso (S-01). El resto de hallazgos son medios o bajos y son habituales en un MVP.

## Hallazgos

| ID | Severidad | Hallazgo | Evidencia |
| --- | --- | --- | --- |
| S-01 | **Crítica** | **Amistad sin consentimiento.** `PUT /api/users/:id/friendship` crea la amistad en los dos sentidos sin solicitud ni aceptación. Quien la crea pasa a ser «amigo» y accede a todos los temas privados del otro, también a los ya existentes, a sus historias y a sus notificaciones futuras. Ya figuraba como Q-04, sin resolver. | `friendship-service.ts:34-45` (`add`), `visibility-policy.ts:36-41`, `story-service.ts:35-48`, `docs/01-producto.md` Q-04 |
| S-02 | **Alta** | **Credenciales de prueba en producción.** El build puede ejecutar el seed con `RUN_SEED=1`, que crea `ana`, `bruno`, `carla` y `dani` con la contraseña `password123` y emails `@opina.test`. Si se ejecutó en el despliegue, cualquiera puede entrar como ellos. **No verificado** (no se ha intentado iniciar sesión). | `scripts/vercel-build.mjs:34-36`, `prisma/seed.ts:11` |
| S-03 | **Alta** | **Sin límite de intentos.** No hay ninguna limitación en login, token de la app, registro ni solicitudes de amistad. Permite fuerza bruta de contraseñas, registro masivo y spam de amistades. bcrypt con coste 12 lo frena algo. | Sin coincidencias de `rate limit` en `src/` |
| S-04 | Media | **Enumeración de cuentas.** El registro dice «El nombre de usuario o el email ya están registrados», lo que confirma emails ajenos. En el login, si el email no existe no se hace la comparación de bcrypt y la respuesta es más rápida. | `auth-service.ts:24-30`, `auth-service.ts:55-58` |
| S-05 | Media | **Imágenes de temas privados públicas.** `/api/media/*` no exige sesión y se sirve con `Cache-Control: public, immutable`. La clave es aleatoria, pero quien tenga la URL ve la imagen para siempre, aunque pierda la amistad. | `middleware.ts:10`, `api/media/[...key]/route.ts:7-31` |
| S-06 | Media | **Sin cabeceras de seguridad** (CSP, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`) configuradas en la app. | `next.config.ts` no define `headers()` |
| S-07 | Media | **Sesiones de 30 días sin revocación.** La cookie y el token de la app son JWT válidos 30 días; no hay forma de cerrarlos desde el servidor si se roban ni al cambiar la contraseña (que además no existe). El token de la app se guarda en `SharedPreferences`, sin cifrado adicional. | `auth/config.ts:17-20`, `auth/bearer.ts`, `platform/token-store.ts` |
| S-08 | Baja | **`trustHost: true`** con un comentario que dice «despliegue autoalojado (no Vercel)», cuando se despliega en Vercel. | `auth/config.ts:14-16` |
| S-09 | Baja | **Contraseña sin máximo.** bcrypt solo procesa 72 bytes y una contraseña enorme cuesta CPU. | `lib/validation/auth.ts:27` |

## Lo que está bien

- **Control de acceso centralizado:** `VisibilityPolicy` decide en un solo punto, y detalle, voto, opiniones, perfil e historias lo usan. Un tema privado ajeno responde `404`, igual que uno inexistente, para no revelar que existe.
- **Opiniones y totales solo tras votar**, y solo a quien puede acceder al tema.
- **Datos personales:** el email y el hash de la contraseña nunca salen en las respuestas (`/api/me`, usuarios, perfiles); la API de personas no los selecciona.
- **Autenticación:** contraseñas con bcrypt (coste 12), mensaje genérico en el login, tokens de la app con sal distinta a la cookie web, middleware que deniega por defecto toda ruta no pública.
- **Inyección:** las consultas SQL en bruto usan `Prisma.sql` con parámetros, los ids se validan como UUID y los patrones `LIKE` se escapan.
- **CORS** limitado a los orígenes de la app Android.
- **Subida de imágenes:** tamaño máximo, tipo por *magic bytes* y nombre aleatorio.
- **Errores:** los 500 no exponen el mensaje interno.

## Qué hacer

El orden de trabajo está en [`tasks.md`](../openspec/changes/amistades-y-confidencialidad/tasks.md). De más a menos urgente:

1. **Ahora:** S-02 (comprobar y limpiar el seed en producción) y decidir Q-04.
2. S-01: solicitud y aceptación de amistad.
3. S-03: límite de intentos.
4. S-05, S-06, S-04 y S-09.
5. S-07 y S-08: decidir si se aceptan.

## Estado tras las correcciones (8 de noviembre de 2026)

Cambio [`amistades-y-confidencialidad`](../openspec/changes/amistades-y-confidencialidad/tasks.md). Todo está **hecho y probado en local; nada está desplegado todavía**.

| ID | Estado | Qué se hizo o por qué se acepta |
| --- | --- | --- |
| S-01 | Cerrado en código | La amistad exige solicitud y aceptación (`friend_requests`, TKT-077 a TKT-081). Una solicitud pendiente no da acceso. Las amistades anteriores se consideran aceptadas, incluidas las creadas sin consentimiento. |
| S-02 | Mitigado en el build; **producción sin comprobar** | El build de Vercel falla con `RUN_SEED=1` en producción sin `ALLOW_PRODUCTION_SEED=1`, y el seed exige `SEED_PASSWORD` fuera de local. Falta comprobar la base de Neon con la consulta de `docs/08-despliegue-vercel.md` §8.6. |
| S-03 | Cerrado | Límite de intentos en login web, token de la app, registro (20 por hora y por IP) y solicitudes de amistad (30 por hora y por usuario), en PostgreSQL (`rate_limits`). Ventana fija. |
| S-04 | Parcial, aceptado | El login ya no distingue entre email inexistente y contraseña incorrecta, ni en el mensaje ni en el tiempo. El registro **sigue diciendo** que el usuario o el email ya existen: el nombre de usuario es público en Personas y el registro está limitado por IP. |
| S-05 | Cerrado | Las imágenes de temas privados llevan una URL firmada de 30 minutos (`?exp=&sig=`) y `/api/media` responde `404` sin firma válida. Las públicas y los avatares no cambian. |
| S-06 | Cerrado con matiz | CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` y HSTS en la web. La CSP permite scripts en línea (`'unsafe-inline'`) porque Next los necesita sin nonces. La APK no recibe cabeceras (export estático). |
| S-07 | **Aceptado** | Ver «Decisión sobre las sesiones». |
| S-08 | Cerrado | `trustHost` solo se activa en Vercel, en desarrollo y pruebas, o con `AUTH_TRUST_HOST=true`. En Vercel se recomienda fijar `AUTH_URL`. |
| S-09 | Cerrado | La contraseña admite de 8 a 72 bytes en el registro. |

### Decisión sobre las sesiones (S-07)

**No se añade revocación de sesiones en este MVP.** Motivos: no existe cambio ni recuperación de contraseña, así que no hay un suceso que obligue a cerrar sesiones; la cookie web de Auth.js es `httpOnly` y viaja por HTTPS con HSTS; la CSP limita el robo por scripts; y revocar exigiría consultar la base de datos en cada petición del middleware (que corre en Edge) o llevar una versión de sesión por usuario. El riesgo que se acepta es que un token robado, sobre todo el de la app Android guardado en `SharedPreferences`, sirva hasta 30 días.

**Se revisa si** se añade cambio o recuperación de contraseña (entonces hay que invalidar las sesiones anteriores con una `sessionVersion` por usuario en el JWT), si se publica la APK a más personas, o si aparece un incidente.

## Alcance y límites de esta revisión

No incluye pruebas dinámicas, análisis de dependencias (`npm audit`), configuración de Vercel, Neon o Cloudflare R2, ni revisión de la APK. No se ha iniciado sesión en la aplicación desplegada con credenciales de prueba.
