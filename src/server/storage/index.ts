import { S3ImageStorage } from "@/server/storage/s3-image-storage";
import { InMemoryImageStorage } from "@/server/storage/in-memory-image-storage";
import type { ImageStorage } from "@/server/storage/image-storage";

/**
 * `IMAGE_STORAGE=memory` (solo en `.env.test`) selecciona el almacenamiento
 * en memoria, para que las pruebas de integración no dependan de MinIO.
 */
export const imageStorage: ImageStorage =
  process.env.IMAGE_STORAGE === "memory" ? InMemoryImageStorage : S3ImageStorage;

export { MAX_IMAGE_SIZE_BYTES, validateImageFile } from "@/server/storage/image-storage";
export type {
  ImageStorage,
  StoredImage,
  UploadedImage,
  UploadOptions,
} from "@/server/storage/image-storage";
