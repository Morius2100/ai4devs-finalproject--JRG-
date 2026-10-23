-- Migración de datos (sin cambios de esquema): las imágenes subidas pasan de guardarse
-- como URL absoluta del bucket a guardarse como clave (`avatars/<uuid>.png`,
-- `topics/<uuid>.webp`). La API las expone como `/api/media/<clave>`.
-- Las URLs externas (p. ej. https://picsum.photos/... del seed) no terminan en una clave
-- y quedan intactas. No depende del host ni de S3_PUBLIC_URL.
--
-- Vuelta atrás: anteponer de nuevo el prefijo público del bucket a las claves, p. ej.
--   UPDATE users SET avatar_url = 'http://localhost:9000/opina-images/' || avatar_url
--   WHERE avatar_url ~ '^(avatars|topics)/';
--   (igual para topics.image_url)

UPDATE "users"
SET "avatar_url" = substring("avatar_url" from '((avatars|topics)/[0-9a-f-]{36}\.(jpg|png|webp))$')
WHERE "avatar_url" ~ '^[a-zA-Z][a-zA-Z0-9+.-]*://'
  AND "avatar_url" ~ '(avatars|topics)/[0-9a-f-]{36}\.(jpg|png|webp)$';

UPDATE "topics"
SET "image_url" = substring("image_url" from '((avatars|topics)/[0-9a-f-]{36}\.(jpg|png|webp))$')
WHERE "image_url" ~ '^[a-zA-Z][a-zA-Z0-9+.-]*://'
  AND "image_url" ~ '(avatars|topics)/[0-9a-f-]{36}\.(jpg|png|webp)$';
