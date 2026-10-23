import Image from "next/image";
import { resolveMediaUrl } from "@/lib/platform/media";

/**
 * Imagen del tema en la mitad superior de la pantalla (TKT-017).
 * `dvh` en vez de `vh` para que la barra del navegador móvil no descuadre
 * la mitad de la pantalla (design.md de fase-3-detalle-tema).
 */
export function TopicImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative h-[50dvh] w-full">
      <Image
        src={resolveMediaUrl(src)}
        alt={alt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
    </div>
  );
}
