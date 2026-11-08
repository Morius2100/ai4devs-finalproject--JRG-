-- CreateTable: contadores del límite de intentos (S-03, cambio amistades-y-confidencialidad).
-- Ventana fija por clave: `window_start` marca el inicio y `count` las peticiones desde entonces.
CREATE TABLE "rate_limits" (
    "key" VARCHAR(200) NOT NULL,
    "window_start" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key")
);
