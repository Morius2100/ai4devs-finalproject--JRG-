# 6. Stack tecnológico

## 6.1 Resumen

| Ámbito                        | Tecnología                                               | Versión objetivo |
| ----------------------------- | -------------------------------------------------------- | ---------------- |
| Lenguaje                      | TypeScript (modo `strict`)                               | 5.x              |
| Runtime                       | Node.js                                                  | 22 LTS           |
| Framework full-stack          | Next.js (App Router, Route Handlers, Middleware)         | 15.x             |
| UI                            | React                                                    | 19.x             |
| Estilos                       | Tailwind CSS                                             | 4.x              |
| Base de datos                 | PostgreSQL (+ extensión `pg_trgm`)                       | 16               |
| ORM y migraciones             | Prisma                                                   | 6.x              |
| Autenticación                 | Auth.js (NextAuth v5), proveedor Credentials, sesión JWT | 5.x              |
| Hash de contraseñas           | bcryptjs                                                 | 2.x              |
| Validación                    | Zod (compartido cliente/servidor)                        | 3.x              |
| Almacenamiento de imágenes    | S3-compatible vía `@aws-sdk/client-s3` (MinIO en local)  | 3.x              |
| Detección de tipo de imagen   | `file-type` (magic bytes)                                | 19.x             |
| Obtención de datos en cliente | TanStack Query (`useInfiniteQuery` para scroll infinito) | 5.x              |
| App Android                   | Capacitor (export estático de Next.js + plugins oficiales) | 8.x            |
| Tests unitarios / integración | Vitest + Testing Library                                 | 2.x              |
| Tests end-to-end              | Playwright                                               | 1.x              |
| Calidad de código             | ESLint, Prettier                                         | —                |
| Entorno local                 | Docker Compose (PostgreSQL + MinIO)                      | —                |
| CI                            | GitHub Actions                                           | —                |
| Metodología                   | OpenSpec (Spec Driven Development)                       | 1.4.x            |

## 6.2 Justificación

| Decisión                         | Motivo                                                                                                                                                                                                   | Alternativas descartadas                                                                                  |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Next.js full-stack**           | Un único proyecto y lenguaje para UI y API; Route Handlers suficientes para el contrato de la API. Las pantallas cargan sus datos desde el cliente para poder exportarse a la app Android.                                       | SPA (React/Vite) + API separada (Express/NestJS): más piezas a desplegar sin beneficio para este dominio. |
| **Web mobile-first + app Android con Capacitor** | La experiencia se describe en términos de pantalla de móvil. La app Android empaqueta la misma interfaz (export estático con `OPINA_TARGET=mobile`) y usa la API desplegada con un token Bearer, así que web y app comparten todo el código de pantallas. | React Native / Flutter: duplicarían todas las pantallas. APK que solo carga la web remota: no funciona sin servidor accesible ni se comporta como app. |
| **PostgreSQL**                   | Datos fuertemente relacionales (usuarios, amistades, votos) y necesidad de integridad (voto único, contadores consistentes en transacción); `pg_trgm` resuelve la búsqueda parcial sin un motor externo. | MongoDB: integridad referencial más débil; Elasticsearch: excesivo para búsqueda por título.              |
| **Prisma**                       | Esquema declarativo, migraciones versionadas y tipos generados que encajan con SDD (el modelo de datos de la documentación es directamente el `schema.prisma`).                                          | Drizzle / TypeORM: válidos; Prisma prioriza legibilidad del esquema.                                      |
| **Auth.js Credentials**          | Cubre el mínimo habilitante (S-01) integrado con Next.js sin servicios externos.                                                                                                                         | Proveedores OAuth: no especificados en el producto.                                                       |
| **Almacenamiento S3-compatible** | Las imágenes no deben guardarse en la base de datos ni en el disco del contenedor; MinIO permite el mismo código en local y en producción.                                                               | Guardar en BD (bytea): penaliza rendimiento; disco local: no escala ni sobrevive a redeploys.             |
| **TanStack Query**               | Gestiona caché, paginación por cursor y scroll infinito de lista de temas, búsqueda y opiniones con una sola primitiva.                                                                                  | SWR: equivalente; se elige por `useInfiniteQuery`.                                                        |
| **Zod**                          | Un único esquema de validación para formulario y API evita divergencias.                                                                                                                                 | Validación manual.                                                                                        |
| **Vitest + Playwright**          | Cada escenario de las specs se traduce en un test de integración o e2e.                                                                                                                                  | Jest: más lento con ESM/TS.                                                                               |

## 6.3 Convenciones

- **Idioma:** código e identificadores en inglés; textos de interfaz y documentación en español.
- **Rutas de UI en español** (`/temas/nuevo`, `/notificaciones`); rutas de API en inglés (`/api/topics`).
- **Commits:** Conventional Commits, referenciando el ticket (`feat(votes): emitir voto TKT-019`).
- **Ramas:** una rama por cambio SDD (`feat/fase-4-votacion-opiniones`).
- **Tests:** cada escenario `#### Scenario` de una spec debe tener al menos un test cuyo nombre lo cite.
