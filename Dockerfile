# syntax=docker/dockerfile:1.7
# Imagen de la aplicación Opina (web + API), salida `standalone` de Next.js.
# Construir:  docker build -t opina .
# Entorno completo en local:  docker compose --profile app up -d --build
# En producción la aplicación se despliega en Vercel; esta imagen sirve para reproducirla.

ARG NODE_VERSION=22
ARG PRISMA_VERSION=6.19.3

# --- Base: Node 22 sobre Debian (los motores de Prisma necesitan openssl) -------------
FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# --- Dependencias ----------------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# --- Compilación -----------------------------------------------------------------------
FROM deps AS build
COPY . .
# `src/server/env.ts` valida las variables al importarse, y `next build` importa el código del
# servidor. Estos valores son de RELLENO, solo existen en esta etapa y no llegan a la imagen final:
# los reales se pasan al arrancar el contenedor.
ENV NEXT_OUTPUT=standalone \
  DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" \
  AUTH_SECRET="relleno-solo-para-compilar" \
  S3_ENDPOINT="http://localhost:9000" \
  S3_REGION="us-east-1" \
  S3_BUCKET="build" \
  S3_ACCESS_KEY_ID="build" \
  S3_SECRET_ACCESS_KEY="build" \
  S3_PUBLIC_URL="http://localhost:9000/build"
RUN npx prisma generate && npm run build

# --- CLI de Prisma, para aplicar las migraciones al arrancar ---------------------------------
FROM base AS prisma-cli
ARG PRISMA_VERSION
RUN mkdir -p /opt/prisma-cli \
  && cd /opt/prisma-cli \
  && npm init -y >/dev/null \
  && npm install --no-audit --no-fund "prisma@${PRISMA_VERSION}"

# --- Imagen final ------------------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production \
  PORT=3000 \
  HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
# Esquema y migraciones: el CLI usa las rutas por defecto (prisma/schema.prisma, prisma/migrations).
COPY --chown=node:node prisma ./prisma
COPY --from=prisma-cli --chown=node:node /opt/prisma-cli /opt/prisma-cli
COPY --chown=node:node docker/entrypoint.sh /usr/local/bin/opina-entrypoint
RUN chmod +x /usr/local/bin/opina-entrypoint

USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["opina-entrypoint"]
CMD ["node", "server.js"]
