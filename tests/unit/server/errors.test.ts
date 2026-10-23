import { describe, expect, it } from "vitest";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  PayloadTooLargeError,
  UnauthorizedError,
  UnsupportedMediaTypeError,
  ValidationError,
} from "@/server/errors";
import { toHttpResponse } from "@/server/http";

async function bodyOf(response: Response) {
  return (await response.json()) as { error: { code: string; message: string } };
}

describe("toHttpResponse", () => {
  it("mapea ValidationError a 400 con el código VALIDATION_ERROR", async () => {
    const response = toHttpResponse(new ValidationError("Datos inválidos"));
    expect(response.status).toBe(400);
    const body = await bodyOf(response);
    expect(body.error).toEqual({ code: "VALIDATION_ERROR", message: "Datos inválidos" });
  });

  it("incluye fieldErrors cuando ValidationError los define", async () => {
    const response = toHttpResponse(
      new ValidationError("Datos inválidos", { email: ["Email inválido"] }),
    );
    const body = (await response.json()) as {
      error: { code: string; message: string; fieldErrors?: Record<string, string[]> };
    };
    expect(body.error.fieldErrors).toEqual({ email: ["Email inválido"] });
  });

  it("mapea UnauthorizedError a 401", async () => {
    const response = toHttpResponse(new UnauthorizedError());
    expect(response.status).toBe(401);
    expect((await bodyOf(response)).error.code).toBe("UNAUTHORIZED");
  });

  it("mapea ForbiddenError a 403", async () => {
    const response = toHttpResponse(new ForbiddenError());
    expect(response.status).toBe(403);
    expect((await bodyOf(response)).error.code).toBe("FORBIDDEN");
  });

  it("mapea NotFoundError a 404", async () => {
    const response = toHttpResponse(new NotFoundError());
    expect(response.status).toBe(404);
    expect((await bodyOf(response)).error.code).toBe("NOT_FOUND");
  });

  it("mapea ConflictError a 409", async () => {
    const response = toHttpResponse(new ConflictError("Ya existe"));
    expect(response.status).toBe(409);
    expect((await bodyOf(response)).error.code).toBe("CONFLICT");
  });

  it("mapea PayloadTooLargeError a 413", async () => {
    const response = toHttpResponse(new PayloadTooLargeError());
    expect(response.status).toBe(413);
    expect((await bodyOf(response)).error.code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("mapea UnsupportedMediaTypeError a 415", async () => {
    const response = toHttpResponse(new UnsupportedMediaTypeError());
    expect(response.status).toBe(415);
    expect((await bodyOf(response)).error.code).toBe("UNSUPPORTED_MEDIA_TYPE");
  });

  it("mapea un error no reconocido a 500 sin exponer el mensaje interno", async () => {
    const response = toHttpResponse(new Error("detalle interno sensible"));
    expect(response.status).toBe(500);
    const body = await bodyOf(response);
    expect(body.error.code).toBe("INTERNAL_ERROR");
    expect(body.error.message).not.toContain("detalle interno sensible");
  });
});
