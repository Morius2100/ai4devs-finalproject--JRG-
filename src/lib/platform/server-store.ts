import { Preferences } from "@capacitor/preferences";
import { isNativeApp } from "@/lib/platform/native";

const SERVER_KEY = "opina.server-url";
const CHECK_TIMEOUT_MS = 5000;

// `undefined` = aún sin leer de Preferences; `null` = sin servidor configurado.
let cached: string | null | undefined;

/**
 * ¿Puede el usuario elegir el servidor? Solo en el build de desarrollo de la
 * app (`build:mobile:dev` fija la variable); en producción y en la web, nunca.
 */
export function isServerConfigurable(): boolean {
  return isNativeApp() && process.env.NEXT_PUBLIC_OPINA_SERVER_CONFIGURABLE === "true";
}

/** Servidor fijado al compilar: vacío en la web (mismo origen). */
export function defaultServerUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "";
}

/** Lee el servidor guardado. Hay que esperarlo antes de pintar o pedir datos. */
export async function initServer(): Promise<void> {
  if (!isServerConfigurable()) return;
  cached = (await Preferences.get({ key: SERVER_KEY })).value;
}

/** Servidor en uso, de forma síncrona (las URLs de imagen se resuelven al pintar). */
export function currentServerUrl(): string {
  return isServerConfigurable() && cached ? cached : defaultServerUrl();
}

export async function setServer(url: string): Promise<void> {
  cached = url;
  await Preferences.set({ key: SERVER_KEY, value: url });
}

/** Vuelve al servidor fijado al compilar. */
export async function resetServer(): Promise<void> {
  cached = null;
  await Preferences.remove({ key: SERVER_KEY });
}

/**
 * `protocolo://host[:puerto]` de lo que escribe el usuario, o `null` si no es
 * una dirección `http://` o `https://` con host. Descarta ruta, consulta y fragmento.
 */
export function normalizeServerUrl(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (!url.hostname) return null;
  return url.origin;
}

/** ¿Responde un servidor Opina en esa dirección? (`GET /api/health` → `{ status: "ok" }`). */
export async function checkServer(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}/api/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
    });
    if (!response.ok) return false;
    const body = (await response.json().catch(() => null)) as { status?: string } | null;
    return body?.status === "ok";
  } catch {
    return false;
  }
}
