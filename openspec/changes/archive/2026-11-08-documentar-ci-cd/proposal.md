## Why

La Revisión 1 de LIDR (tarea **T10**, fase de despliegue) pide el diagrama de integración y despliegue continuos. Al documentarlo se vio que el CI de GitHub Actions **fallaba en todas las ejecuciones desde el primer commit** (en `npm ci`, porque el lock lo generó npm 11 y el CI usa npm 10) y que **el despliegue de Vercel no espera al CI**: se desplegó a producción con el CI en rojo.

## What Changes

- `docs/12-ci-cd.md`: diagrama de la canalización completa (desarrollo → GitHub → CI y Vercel → producción), del CI paso a paso y de los entornos, con los huecos que quedan.
- `package-lock.json` regenerado con npm 10: añade 7 entradas que faltaban y no cambia ninguna versión. Es válido para npm 10 y npm 11.
- `.github/workflows/ci.yml`: `IMAGE_STORAGE=memory`, porque el CI no levanta MinIO y las pruebas de imágenes lo necesitan.
- Enlaces desde `docs/08`, `docs/README.md` y el README de entrega.

## Capabilities

### New Capabilities
- `ci-cd`: el repositorio documenta cómo se comprueba y se despliega un cambio, y el CI puede instalar las dependencias y ejecutar sus pasos.

### Modified Capabilities
<!-- Ninguna. -->

## Impact

- **Afectado:** `docs/`, `package-lock.json` y `.github/workflows/ci.yml`. No cambia código de la aplicación.
- **Pendiente:** comprobar en GitHub, tras el push, que el CI llega en verde (los pasos posteriores a `npm ci` nunca se habían ejecutado) y decidir si se bloquea el despliegue hasta que el CI pase.
