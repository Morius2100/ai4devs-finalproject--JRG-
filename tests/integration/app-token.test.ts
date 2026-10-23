import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { encode } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { prisma } from "@/server/db/client";
import { AuthService } from "@/server/services/auth-service";
import { createAppToken, readBearerUser } from "@/server/auth/bearer";
import { POST as tokenRoute } from "@/app/api/auth/token/route";

const headerStore = vi.hoisted(() => ({ current: new Headers() }));
vi.mock("next/headers", () => ({ headers: async () => headerStore.current }));
vi.mock("@/server/auth", () => ({ auth: vi.fn(async () => null) }));

const { requireUser } = await import("@/server/auth/require-user");
const { default: middleware } = await import("@/middleware");

const RUN_ID = Date.now().toString(36);
const EMAIL = `tok+${RUN_ID}@example.com`;
let user: { id: string; username: string };

beforeAll(async () => {
  user = await AuthService.register({
    username: `tok${RUN_ID}`,
    email: EMAIL,
    password: "password123",
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: `tok+${RUN_ID}` } } });
  await prisma.$disconnect();
});

function tokenRequest(body: unknown) {
  return new Request("http://localhost/api/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function runMiddleware(path: string, init: { method?: string; headers?: Record<string, string> }) {
  const request = new NextRequest(`http://localhost:3000${path}`, init);
  return (middleware as unknown as (req: NextRequest, ctx: unknown) => Promise<Response>)(
    request,
    {},
  );
}

describe("POST /api/auth/token (TKT-042)", () => {
  it("Inicio de sesión en la app: credenciales correctas devuelven token y usuario", async () => {
    const response = await tokenRoute(tokenRequest({ email: EMAIL, password: "password123" }));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.user).toEqual({ id: user.id, username: user.username });
    expect(await readBearerUser(new Headers({ authorization: `Bearer ${body.token}` }))).toEqual({
      id: user.id,
      username: user.username,
    });
  });

  it("Credenciales incorrectas: 401 genérico y sin token", async () => {
    const response = await tokenRoute(tokenRequest({ email: EMAIL, password: "otra-clave" }));
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error.message).toBe("Credenciales incorrectas");
    expect(body).not.toHaveProperty("token");
  });

  it("Datos inválidos: mismo 401 genérico", async () => {
    const response = await tokenRoute(tokenRequest({ email: "no-es-email" }));
    expect(response.status).toBe(401);
  });
});

describe("Lectura del token Bearer (TKT-042)", () => {
  it("Token manipulado: se rechaza", async () => {
    const token = await createAppToken(user);
    const tampered = `${token.slice(0, -4)}AAAA`;
    expect(await readBearerUser(new Headers({ authorization: `Bearer ${tampered}` }))).toBeNull();
  });

  it("Una cookie de sesión web no sirve como token de la app", async () => {
    const cookieToken = await encode({
      salt: "authjs.session-token",
      secret: process.env.AUTH_SECRET!,
      token: { id: user.id, username: user.username },
    });
    expect(
      await readBearerUser(new Headers({ authorization: `Bearer ${cookieToken}` })),
    ).toBeNull();
  });

  it("requireUser acepta el token Bearer si no hay cookie", async () => {
    headerStore.current = new Headers({ authorization: `Bearer ${await createAppToken(user)}` });
    await expect(requireUser()).resolves.toEqual({ id: user.id, username: user.username });
  });

  it("requireUser sin cookie ni token lanza 401", async () => {
    headerStore.current = new Headers();
    await expect(requireUser()).rejects.toMatchObject({ status: 401 });
  });
});

describe("Middleware: Bearer y CORS (TKT-042, TKT-043)", () => {
  it("Petición a la API con token Bearer: pasa", async () => {
    const response = await runMiddleware("/api/topics", {
      headers: { authorization: `Bearer ${await createAppToken(user)}` },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("Token inválido: 401 con formato estándar", async () => {
    const response = await runMiddleware("/api/topics", {
      headers: { authorization: "Bearer basura" },
    });
    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("UNAUTHORIZED");
  });

  it("Petición previa desde la app: 204 con CORS para su origen", async () => {
    const response = await runMiddleware("/api/topics", {
      method: "OPTIONS",
      headers: { origin: "https://localhost", "access-control-request-headers": "authorization" },
    });
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe("https://localhost");
    expect(response.headers.get("access-control-allow-headers")).toContain("Authorization");
    expect(response.headers.get("access-control-allow-credentials")).toBeNull();
  });

  it("El 401 también lleva CORS para que la app pueda leerlo", async () => {
    const response = await runMiddleware("/api/topics", {
      headers: { origin: "http://localhost" },
    });
    expect(response.status).toBe(401);
    expect(response.headers.get("access-control-allow-origin")).toBe("http://localhost");
  });

  it("Origen no permitido: sin Access-Control-Allow-Origin", async () => {
    const response = await runMiddleware("/api/topics", {
      method: "OPTIONS",
      headers: { origin: "https://ejemplo.com" },
    });
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("Pantalla sin sesión: sigue redirigiendo a /login", async () => {
    const response = await runMiddleware("/personas", {});
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login");
  });
});
