/** Eventos globales de la capa de plataforma que escuchan `AuthGate` y `NativeShell`. */
export const UNAUTHORIZED_EVENT = "opina:unauthorized";
export const NETWORK_ERROR_EVENT = "opina:network-error";

export function emit(name: typeof UNAUTHORIZED_EVENT | typeof NETWORK_ERROR_EVENT): void {
  window.dispatchEvent(new Event(name));
}
