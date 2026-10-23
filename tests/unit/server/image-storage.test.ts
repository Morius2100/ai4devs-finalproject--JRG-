import { describe, expect, it } from "vitest";
import { MAX_IMAGE_SIZE_BYTES, validateImageFile } from "@/server/storage/image-storage";
import { PayloadTooLargeError, UnsupportedMediaTypeError } from "@/server/errors";

// PNG mínimo real: firma + chunk IHDR (file-type necesita el chunk, no
// solo la firma, o lanza EndOfStreamError con un buffer truncado).
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const PNG_MINIMAL = Buffer.concat([
  PNG_SIGNATURE,
  Buffer.from([0, 0, 0, 13]), // longitud del chunk IHDR
  Buffer.from("IHDR"),
  Buffer.alloc(13), // datos del IHDR (no importan para la detección)
  Buffer.alloc(4), // CRC
]);
const PDF_SIGNATURE = Buffer.from("%PDF-1.4\n%âãÏÓ\n");

function makeFile(buffer: Buffer, name: string, type: string): File {
  return new File([new Uint8Array(buffer)], name, { type });
}

describe("validateImageFile", () => {
  it("PNG válido: se acepta y detecta la extensión png", async () => {
    const file = makeFile(PNG_MINIMAL, "foto.png", "image/png");
    const result = await validateImageFile(file);
    expect(result.ext).toBe("png");
  });

  it("Imagen de 6 MB: PayloadTooLargeError (413)", async () => {
    const big = Buffer.concat([PNG_MINIMAL, Buffer.alloc(6 * 1024 * 1024)]);
    const file = makeFile(big, "big.png", "image/png");
    await expect(validateImageFile(file)).rejects.toBeInstanceOf(PayloadTooLargeError);
  });

  it("Tamaño exacto de 5 MB: no se rechaza por tamaño", async () => {
    const exact = Buffer.concat([
      PNG_MINIMAL,
      Buffer.alloc(MAX_IMAGE_SIZE_BYTES - PNG_MINIMAL.length),
    ]);
    const file = makeFile(exact, "exact.png", "image/png");
    await expect(validateImageFile(file)).resolves.toMatchObject({ ext: "png" });
  });

  it("PDF renombrado como .jpg: UnsupportedMediaTypeError (415), no se fía de la extensión ni del MIME", async () => {
    const file = makeFile(PDF_SIGNATURE, "foto.jpg", "image/jpeg");
    await expect(validateImageFile(file)).rejects.toBeInstanceOf(UnsupportedMediaTypeError);
  });

  it("Buffer truncado que empieza como un formato conocido: UnsupportedMediaTypeError, no un 500", async () => {
    const file = makeFile(PNG_SIGNATURE, "truncado.png", "image/png");
    await expect(validateImageFile(file)).rejects.toBeInstanceOf(UnsupportedMediaTypeError);
  });
});
