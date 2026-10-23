/**
 * Imágenes subidas (TKT-067): la base de datos guarda su clave
 * (`avatars/<uuid>.png`, `topics/<uuid>.webp`) y la API las expone como ruta
 * relativa `/api/media/<clave>`, que el cliente resuelve contra el servidor
 * en uso. Las URLs externas (p. ej. las del seed) se devuelven sin cambios.
 */
export const MEDIA_KEY_PATTERN = /^(avatars|topics)\/[0-9a-f-]{36}\.(jpg|png|webp)$/;

const ABSOLUTE_URL = /^[a-z][a-z0-9+.-]*:\/\//i;

/** Valor guardado en base de datos → URL que devuelve la API. */
export function toMediaUrl(stored: string | null): string | null {
  if (stored === null) return null;
  return ABSOLUTE_URL.test(stored) ? stored : `/api/media/${stored}`;
}

/** ¿Es una clave de foto de perfil propia del almacenamiento (y no una URL externa)? */
export function isAvatarKey(stored: string | null): stored is string {
  return stored !== null && stored.startsWith("avatars/") && MEDIA_KEY_PATTERN.test(stored);
}
