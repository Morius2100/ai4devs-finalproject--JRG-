import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { env } from "@/server/env";
import {
  validateImageFile,
  type ImageStorage,
  type StoredImage,
  type UploadedImage,
  type UploadOptions,
} from "@/server/storage/image-storage";

const client = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  // Necesario para MinIO (y cualquier S3 compatible que no use subdominios
  // por bucket): usa http://endpoint/bucket/key en vez de bucket.endpoint.
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
});

/**
 * Almacenamiento de imágenes en S3/MinIO (TKT-024): mismo código en local
 * y en producción, solo cambian las variables de entorno `S3_*`.
 */
export const S3ImageStorage: ImageStorage = {
  async upload(file: File, options?: UploadOptions): Promise<UploadedImage> {
    const { buffer, ext } = await validateImageFile(file);
    const key = `${options?.prefix ?? "topics"}/${crypto.randomUUID()}.${ext}`;

    await client.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type || `image/${ext}`,
      }),
    );

    return { key };
  },

  async remove(key: string): Promise<void> {
    await client.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
  },

  async read(key: string): Promise<StoredImage | null> {
    try {
      const response = await client.send(new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
      if (!response.Body) return null;
      return {
        body: await response.Body.transformToByteArray(),
        contentType: response.ContentType ?? "application/octet-stream",
      };
    } catch (error) {
      if (error instanceof Error && (error.name === "NoSuchKey" || error.name === "NotFound")) {
        return null;
      }
      throw error;
    }
  },
};
