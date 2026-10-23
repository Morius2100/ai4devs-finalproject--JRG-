-- AlterTable: perfil mínimo de usuario (foto y descripción opcionales, F-07)
ALTER TABLE "users" ADD COLUMN "avatar_url" TEXT,
ADD COLUMN "bio" VARCHAR(160);

-- Búsqueda parcial de personas por nombre de usuario sin distinguir mayúsculas.
-- `pg_trgm` ya está creada por la migración inicial.
CREATE INDEX users_username_trgm_idx ON users USING gin (lower(username) gin_trgm_ops);
