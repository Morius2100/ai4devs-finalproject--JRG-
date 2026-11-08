## Context

Dos canalizaciones se disparan con el mismo push: el workflow `CI` (GitHub Actions) y la integración Git de Vercel. Vercel construye con `npm run vercel-build` (migra solo en producción) y publica; no consulta el resultado del CI. Los contenedores locales son PostgreSQL y MinIO; la aplicación no tiene Dockerfile.

## Goals / Non-Goals

**Goals:**
- Un diagrama fiel a lo que existe, no a lo deseable, con los huecos a la vista.
- Que el CI pueda al menos instalar dependencias y avanzar.

**Non-Goals:**
- Bloquear el despliegue hasta que pase el CI (es configuración de GitHub y Vercel, y decisión de proceso).
- Dockerizar la aplicación o construir la APK en CI.

## Decisions

1. **Documentar el estado real, incluidos los fallos.** El diagrama marca con una línea discontinua que el CI «no bloquea el despliegue» y la sección 12.5 lista los huecos. Un diagrama que prometiera un despliegue protegido sería falso.
2. **Regenerar el lock con npm 10, no subir el npm del CI.** El CI usa Node 22 (npm 10), como Vercel y la guía del proyecto; el lock de npm 10 sirve también a npm 11. *Alternativa descartada:* `npm i -g npm@11` en el workflow, que añade un paso y diverge de Vercel.
3. **Almacén de imágenes en memoria en el CI**, igual que `.env.test`, en vez de levantar MinIO como servicio: las pruebas no necesitan un S3 real y el CI queda más rápido.
4. **Diagramas en Mermaid**, que GitHub dibuja directamente; se validaron con el analizador de Mermaid.

## Risks / Trade-offs

- [Pasos del CI que nunca se ejecutaron pueden fallar] → Se avisa en 12.5; hay que revisar el primer CI tras el push.
- [Los e2e comparten la base de datos del CI con las pruebas de integración] → Es como estaba diseñado; si hay flakiness, separar bases de datos.
- [El e2e de `descubrimiento-temas` depende de que `ana` no haya votado ese tema] → En una base nueva del CI cumple, salvo que otros e2e voten antes; vigilar.
