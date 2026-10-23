/**
 * `true` en el build de la app Android. Se fija al compilar (no con
 * `Capacitor.isNativePlatform()`) para que el HTML exportado y el cliente
 * coincidan al hidratar.
 */
export function isNativeApp(): boolean {
  return process.env.NEXT_PUBLIC_OPINA_TARGET === "mobile";
}
