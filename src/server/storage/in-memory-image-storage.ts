import {
  contentTypeForExt,
  validateImageFile,
  type ImageStorage,
  type StoredImage,
  type UploadedImage,
  type UploadOptions,
} from "@/server/storage/image-storage";

const store = new Map<string, { buffer: Buffer; contentType: string }>();

/**
 * Almacenamiento en memoria para tests (TKT-024): mismas validaciones que
 * `S3ImageStorage`, sin red ni dependencia de MinIO/S3.
 */
export const InMemoryImageStorage: ImageStorage = {
  async upload(file: File, options?: UploadOptions): Promise<UploadedImage> {
    const { buffer, ext } = await validateImageFile(file);
    const key = `${options?.prefix ?? "topics"}/${crypto.randomUUID()}.${ext}`;
    store.set(key, { buffer, contentType: contentTypeForExt(ext) });
    return { key };
  },

  async remove(key: string): Promise<void> {
    store.delete(key);
  },

  async read(key: string): Promise<StoredImage | null> {
    const stored = store.get(key);
    return stored ? { body: new Uint8Array(stored.buffer), contentType: stored.contentType } : null;
  },
};

/** Solo para pruebas: ¿sigue guardada la imagen con esta clave? */
export function hasStoredImage(key: string): boolean {
  return store.has(key);
}
