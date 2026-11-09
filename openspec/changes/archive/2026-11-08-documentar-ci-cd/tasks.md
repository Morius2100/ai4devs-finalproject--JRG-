> Origen: **Revisión 1 de LIDR, tarea T10**. No hay ticket TKT: es documentación y reparación del CI.

## 1. Diagnóstico

- [x] 1.1 Leer el workflow, `vercel-build.mjs`, `docker-compose.yml` y la guía de Vercel (T10)
- [x] 1.2 Consultar el estado real del CI en GitHub: 6 de 6 ejecuciones fallidas, todas en `npm ci` (T10)
- [x] 1.3 Reproducir el fallo en local con npm 10: «Missing: magicast@0.3.5 from lock file» (T10)

## 2. Arreglo del CI

- [x] 2.1 Regenerar `package-lock.json` con npm 10: 7 entradas nuevas, ninguna versión cambiada; `npm ci --dry-run` pasa con npm 10 y npm 11 (T10)
- [x] 2.2 `.github/workflows/ci.yml`: `IMAGE_STORAGE=memory` (T10)

## 3. Documentación

- [x] 3.1 `docs/12-ci-cd.md`: diagrama de la canalización, del CI y de los entornos, validados con el analizador de Mermaid (T10)
- [x] 3.2 Enlaces desde `docs/08`, `docs/README.md` y el README de entrega (T10)
- [x] 3.3 Sincronizar con el repositorio de código y el de entrega (T10)

## 4. Verificación en GitHub

- [x] 4.1 Tras el push, el CI pasa `npm ci` y todos los pasos siguientes (confirmado en GitHub el 9 de noviembre de 2026; hizo falta corregir un e2e de accesibilidad) (T10)
- [x] 4.2 Decidido en el cambio `endurecer-cicd-apk-docker`: `main` protegida con un ruleset (PR + check `ci`); Vercel no espera de forma explícita, hueco residual aceptado (T10)
