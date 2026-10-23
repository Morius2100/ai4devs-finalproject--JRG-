import { emit, NETWORK_ERROR_EVENT, UNAUTHORIZED_EVENT } from "@/lib/platform/events";
import { isNativeApp } from "@/lib/platform/native";
import { currentServerUrl } from "@/lib/platform/server-store";
import { tokenStore } from "@/lib/platform/token-store";

/**
 * URL absoluta de la API: vacía en la web (mismo origen); en la app, el
 * servidor en uso (el configurado en el build de desarrollo o el fijado al compilar).
 */
export function apiUrl(path: string): string {
  return `${currentServerUrl()}${path}`;
}

const HEALTH_TIMEOUT_MS = 5000;

/**
 * `true` si la API responde a `GET /api/health`. Sin token ni aviso de fallo
 * de red: la usa la pantalla «Sin conexión» para saber cuándo quitarse.
 */
export async function isApiReachable(): Promise<boolean> {
  try {
    const response = await fetch(apiUrl("/api/health"), {
      cache: "no-store",
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * `fetch` de todos los clientes de `src/lib/api/*` (TKT-044). En la app añade
 * la URL base y el token Bearer; ante un `401` borra el token y avisa a
 * `AuthGate`; ante un fallo de red avisa a la pantalla «Sin conexión».
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const native = isNativeApp();
  const headers = new Headers(init.headers);
  if (native) {
    const token = await tokenStore.get();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  let response: Response;
  try {
    response = await fetch(apiUrl(path), { ...init, headers });
  } catch (error) {
    if (native) {
      emit(NETWORK_ERROR_EVENT);
    }
    throw error;
  }

  if (native && response.status === 401 && !path.startsWith("/api/auth/")) {
    await tokenStore.clear();
    emit(UNAUTHORIZED_EVENT);
  }
  return response;
}
