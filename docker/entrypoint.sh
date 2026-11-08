#!/bin/sh
# Arranque del contenedor de Opina: aplica las migraciones pendientes y lanza la aplicación,
# igual que hace `scripts/vercel-build.mjs` en producción. RUN_MIGRATIONS=0 las omite.
set -e

if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
  echo "Aplicando migraciones…"
  node /opt/prisma-cli/node_modules/prisma/build/index.js migrate deploy
fi

exec "$@"
