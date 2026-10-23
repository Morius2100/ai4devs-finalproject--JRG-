import { MEDIA_KEY_PATTERN } from "@/server/media";
import { imageStorage } from "@/server/storage";

const notFound = () =>
  Response.json({ error: { code: "NOT_FOUND", message: "Imagen no encontrada" } }, { status: 404 });

/**
 * GET /api/media/{clave} — imágenes subidas (fotos de perfil y de temas),
 * servidas desde el mismo servidor que la API (TKT-067). Pública: un `<img>`
 * no puede enviar el token, y las claves son aleatorias (como lo eran las
 * URLs del bucket público). Solo claves `avatars/` y `topics/` con el formato
 * exacto: cualquier otra, o con `..`, responde `404` sin tocar el almacenamiento.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.join("/");
  if (!MEDIA_KEY_PATTERN.test(key)) {
    return notFound();
  }

  const image = await imageStorage.read(key);
  if (!image) {
    return notFound();
  }

  return new Response(image.body as BodyInit, {
    headers: {
      "Content-Type": image.contentType,
      // Las claves son únicas y su contenido no cambia.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
