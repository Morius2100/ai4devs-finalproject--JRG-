import { currentServerUrl } from "@/lib/platform/server-store";

/**
 * URL de una imagen para `<img>` / `next/image` (TKT-069): las imágenes subidas
 * llegan de la API como ruta relativa (`/api/media/...`) y se resuelven contra el
 * servidor en uso (en la web, la base es vacía y queda igual). Las URLs externas
 * (p. ej. las del seed) no cambian.
 */
export function resolveMediaUrl(url: string): string {
  return url.startsWith("/") ? `${currentServerUrl()}${url}` : url;
}
