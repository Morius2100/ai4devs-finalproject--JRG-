import { prisma } from "@/server/db/client";
import { MEDIA_KEY_PATTERN, verifyMediaSignature } from "@/server/media";
import { imageStorage } from "@/server/storage";

const notFound = () =>
  Response.json({ error: { code: "NOT_FOUND", message: "Imagen no encontrada" } }, { status: 404 });

/**
 * GET /api/media/{clave} — imágenes subidas (fotos de perfil y de temas),
 * servidas desde el mismo servidor que la API (TKT-067). Sin sesión: un
 * `<img>` no puede enviar el token. Las claves son aleatorias y solo se aceptan
 * `avatars/` y `topics/` con el formato exacto: cualquier otra, o con `..`,
 * responde `404` sin tocar el almacenamiento.
 *
 * Las imágenes de temas privados (TKT-084) exigen además `?exp=&sig=`, la
 * firma de corta duración que la API añade solo a quien puede ver el tema;
 * sin firma válida, o si el tema no existe, responde `404`. Las de temas
 * públicos y las fotos de perfil siguen siendo públicas y cacheables.
 */
export async function GET(request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.join("/");
  if (!MEDIA_KEY_PATTERN.test(key)) {
    return notFound();
  }

  let isPrivate = false;
  if (key.startsWith("topics/")) {
    const topic = await prisma.topic.findFirst({
      where: { imageUrl: key },
      select: { visibility: true },
    });
    if (!topic) {
      return notFound();
    }
    isPrivate = topic.visibility === "PRIVATE";
  }

  if (isPrivate) {
    const search = new URL(request.url).searchParams;
    if (!verifyMediaSignature(key, search.get("exp"), search.get("sig"))) {
      return notFound();
    }
  }

  const image = await imageStorage.read(key);
  if (!image) {
    return notFound();
  }

  return new Response(image.body as BodyInit, {
    headers: {
      "Content-Type": image.contentType,
      // Las claves son únicas y su contenido no cambia; las privadas no se comparten en cachés.
      "Cache-Control": isPrivate ? "private, max-age=300" : "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
