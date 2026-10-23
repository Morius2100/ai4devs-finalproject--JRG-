import { NextResponse } from "next/server";
import { listTopicsQuerySchema } from "@/lib/validation/topics";
import { createTopicSchema } from "@/lib/validation/topic";
import { TopicService } from "@/server/services/topic-service";
import { requireUser } from "@/server/auth/require-user";
import { PayloadTooLargeError, ValidationError } from "@/server/errors";
import { toHttpResponse } from "@/server/http";

// Cabecera Content-Length: rechaza pronto una petición demasiado grande sin
// llegar a parsear el body completo (design.md de fase-5-creacion-temas).
const MAX_BODY_BYTES = 6 * 1024 * 1024;

/**
 * GET /api/topics — tendencias o búsqueda de temas públicos (TKT-012).
 * Requiere sesión (protegido por el middleware); sin `q` → tendencias.
 */
export async function GET(request: Request) {
  try {
    const user = await requireUser();

    const url = new URL(request.url);
    const parsed = listTopicsQuerySchema.safeParse({
      q: url.searchParams.get("q") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
    });
    if (!parsed.success) {
      throw new ValidationError(
        "Parámetros de búsqueda inválidos",
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const { q, cursor } = parsed.data;
    const page = q
      ? await TopicService.search({ viewerId: user.id, q, cursor })
      : await TopicService.listTrending({ viewerId: user.id, cursor });

    return NextResponse.json(page);
  } catch (error) {
    return toHttpResponse(error);
  }
}

/**
 * POST /api/topics — crea un tema (TKT-025). `multipart/form-data`:
 * `title`, `visibility`, `image?`. Responde `201 { id }`.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser();

    const contentLength = request.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
      throw new PayloadTooLargeError("La petición supera el tamaño máximo permitido");
    }

    const formData = await request.formData();
    const parsed = createTopicSchema.safeParse({
      title: formData.get("title"),
      visibility: formData.get("visibility"),
    });
    if (!parsed.success) {
      throw new ValidationError(
        "Datos de tema inválidos",
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const imageEntry = formData.get("image");
    const imageFile = imageEntry instanceof File && imageEntry.size > 0 ? imageEntry : null;

    const topic = await TopicService.create(parsed.data, user.id, imageFile);
    return NextResponse.json(topic, { status: 201 });
  } catch (error) {
    return toHttpResponse(error);
  }
}
