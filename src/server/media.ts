import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Imágenes subidas (TKT-067): la base de datos guarda su clave
 * (`avatars/<uuid>.png`, `topics/<uuid>.webp`) y la API las expone como ruta
 * relativa `/api/media/<clave>`, que el cliente resuelve contra el servidor
 * en uso. Las URLs externas (p. ej. las del seed) se devuelven sin cambios.
 *
 * Las imágenes de temas privados llevan además una firma de corta duración
 * (`?exp=…&sig=…`, TKT-084): `/api/media` no pide sesión (un `<img>` no envía
 * el token), así que la firma es lo que limita quién puede verlas.
 */
export const MEDIA_KEY_PATTERN = /^(avatars|topics)\/[0-9a-f-]{36}\.(jpg|png|webp)$/;

/** Vida de una URL firmada. */
export const SIGNED_URL_TTL_SECONDS = 30 * 60;

const ABSOLUTE_URL = /^[a-z][a-z0-9+.-]*:\/\//i;

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value) {
    throw new Error("AUTH_SECRET es obligatoria");
  }
  return value;
}

/** Firma HMAC-SHA256 (hex) de `clave` y caducidad `exp` (segundos Unix). */
export function signMediaKey(key: string, exp: number): string {
  return createHmac("sha256", secret()).update(`media:${key}:${exp}`).digest("hex");
}

/**
 * ¿Es válida la firma y no ha caducado? `exp` y `sig` vienen de la query y
 * pueden faltar o estar manipulados. Compara en tiempo constante.
 */
export function verifyMediaSignature(
  key: string,
  exp: string | null,
  sig: string | null,
  nowMs: number = Date.now(),
): boolean {
  if (!exp || !sig || !/^\d{1,12}$/.test(exp) || !/^[0-9a-f]{64}$/.test(sig)) {
    return false;
  }
  const expiresAt = Number(exp);
  if (expiresAt * 1000 < nowMs) {
    return false;
  }
  const expected = Buffer.from(signMediaKey(key, expiresAt), "hex");
  const received = Buffer.from(sig, "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/**
 * Valor guardado en base de datos → URL que devuelve la API. Con
 * `signed: true` (imagen de un tema privado) añade la firma de corta duración.
 */
export function toMediaUrl(
  stored: string | null,
  { signed = false, nowMs = Date.now() }: { signed?: boolean; nowMs?: number } = {},
): string | null {
  if (stored === null) return null;
  if (ABSOLUTE_URL.test(stored)) return stored;

  const url = `/api/media/${stored}`;
  if (!signed) return url;

  const exp = Math.floor(nowMs / 1000) + SIGNED_URL_TTL_SECONDS;
  return `${url}?exp=${exp}&sig=${signMediaKey(stored, exp)}`;
}

/** ¿Es una clave de foto de perfil propia del almacenamiento (y no una URL externa)? */
export function isAvatarKey(stored: string | null): stored is string {
  return stored !== null && stored.startsWith("avatars/") && MEDIA_KEY_PATTERN.test(stored);
}
