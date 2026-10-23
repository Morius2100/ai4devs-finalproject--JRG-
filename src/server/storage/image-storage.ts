import { fileTypeFromBuffer } from "file-type";
import { PayloadTooLargeError, UnsupportedMediaTypeError } from "@/server/errors";

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Imagen subida: se identifica por su clave; la URL pública la construye la API (`toMediaUrl`). */
export type UploadedImage = { key: string };

/** Imagen leída del almacenamiento para servirla en `GET /api/media`. */
export type StoredImage = { body: Uint8Array; contentType: string };

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** Tipo de contenido de una extensión admitida (`jpg`, `png` o `webp`). */
export function contentTypeForExt(ext: string): string {
  return CONTENT_TYPES[ext] ?? "application/octet-stream";
}

/** Carpeta de la clave: imágenes de temas (por defecto) o fotos de perfil. */
export type UploadOptions = { prefix?: "topics" | "avatars" };

/**
 * Almacenamiento de imágenes (TKT-024, docs/02-arquitectura.md §2.3):
 * `upload` valida tipo/tamaño, genera una clave única y sube el archivo;
 * `remove` borra por clave (borrado de mejor esfuerzo si falla la
 * inserción del tema tras subir la imagen).
 */
export interface ImageStorage {
  upload(file: File, options?: UploadOptions): Promise<UploadedImage>;
  remove(key: string): Promise<void>;
  /** Lee una imagen por su clave; `null` si no existe. */
  read(key: string): Promise<StoredImage | null>;
}

/**
 * Valida el tamaño (≤ 5 MB, comprobado antes de leer el contenido) y el
 * tipo real por _magic bytes_ con `file-type` (no se fía de la extensión
 * ni del MIME declarados). Usada por cada implementación de `ImageStorage`.
 */
export async function validateImageFile(file: File): Promise<{ buffer: Buffer; ext: string }> {
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new PayloadTooLargeError("La imagen supera el tamaño máximo de 5 MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  // `fileTypeFromBuffer` puede lanzar (no solo devolver `undefined`) con
  // buffers truncados que empiezan como un formato conocido pero no lo son.
  const detected = await fileTypeFromBuffer(buffer).catch(() => undefined);
  if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime)) {
    throw new UnsupportedMediaTypeError("Solo se permiten imágenes JPEG, PNG o WebP");
  }

  return { buffer, ext: detected.ext };
}
