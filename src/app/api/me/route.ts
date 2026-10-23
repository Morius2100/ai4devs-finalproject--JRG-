import { NextResponse } from "next/server";
import { updateProfileSchema } from "@/lib/validation/users";
import { UserService } from "@/server/services/user-service";
import { requireUser } from "@/server/auth/require-user";
import { PayloadTooLargeError, ValidationError } from "@/server/errors";
import { toHttpResponse } from "@/server/http";

/**
 * GET /api/me — perfil del usuario de la sesión con sus contadores de temas
 * (incluidos los privados) y amigos (TKT-060). Nunca devuelve el email.
 */
export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json(await UserService.getOwnProfile(user.id));
  } catch (error) {
    return toHttpResponse(error);
  }
}

// Cabecera Content-Length: rechaza pronto una petición demasiado grande sin
// llegar a parsear el body completo (como `POST /api/topics`).
const MAX_BODY_BYTES = 6 * 1024 * 1024;

/**
 * PATCH /api/me — edita la foto y la descripción propias (TKT-061).
 * `multipart/form-data`, todo opcional: `bio`, `avatar`, `removeAvatar`.
 * `400` datos inválidos, `413` imagen demasiado grande, `415` formato no admitido;
 * en esos casos no se modifica nada.
 */
export async function PATCH(request: Request) {
  try {
    const user = await requireUser();

    const contentLength = request.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
      throw new PayloadTooLargeError("La petición supera el tamaño máximo permitido");
    }

    const formData = await request.formData();
    const parsed = updateProfileSchema.safeParse({
      bio: formData.get("bio") ?? undefined,
      removeAvatar: formData.get("removeAvatar") ?? undefined,
    });
    if (!parsed.success) {
      throw new ValidationError(
        "Datos de perfil inválidos",
        parsed.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const avatarEntry = formData.get("avatar");
    const avatar = avatarEntry instanceof File && avatarEntry.size > 0 ? avatarEntry : null;

    return NextResponse.json(await UserService.updateProfile(user.id, { ...parsed.data, avatar }));
  } catch (error) {
    return toHttpResponse(error);
  }
}
