import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db/client";
import { RateLimitedError } from "@/server/errors";
import {
  RATE_LIMITS,
  consumeLoginRateLimit,
  consumeRateLimit,
  hashKeyPart,
} from "@/server/rate-limit";
import { AuthService } from "@/server/services/auth-service";
import { requireUser } from "@/server/auth/require-user";
import { POST as postRegister } from "@/app/api/register/route";
import { POST as postToken } from "@/app/api/auth/token/route";
import { POST as postNextAuth } from "@/app/api/auth/[...nextauth]/route";
import { PUT as putFriendship } from "@/app/api/users/[id]/friendship/route";

vi.mock("@/server/auth/require-user", () => ({ requireUser: vi.fn() }));

const TAG = `rl${Date.now().toString(36)}`;
const ip = (name: string) => `ip-${TAG}-${name}`;

let user: { id: string; email: string };
const PASSWORD = "password123";

beforeAll(async () => {
  // Las pruebas de este fichero necesitan el límite activo.
  delete process.env.RATE_LIMIT_DISABLED;
  user = await prisma.user.create({
    data: {
      username: `${TAG}u`,
      email: `${TAG}u@example.com`,
      passwordHash: await bcrypt.hash(PASSWORD, 4),
    },
    select: { id: true, email: true },
  });
});

afterAll(async () => {
  await prisma.$executeRaw`DELETE FROM rate_limits WHERE key LIKE ${`%${TAG}%`}`;
  await prisma.$executeRaw`DELETE FROM rate_limits WHERE key = ${`friend-request:${user.id}`}`;
  await prisma.user.deleteMany({ where: { id: user.id } });
  await prisma.$disconnect();
});

beforeEach(() => {
  vi.mocked(requireUser).mockResolvedValue({ id: user.id, username: "rl" });
});

const jsonRequest = (path: string, body: unknown, forwardedFor: string) =>
  new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": forwardedFor },
    body: JSON.stringify(body),
  });

describe("consumeRateLimit", () => {
  it("Permite hasta el límite y rechaza la siguiente con Retry-After", async () => {
    const key = `test:${TAG}:basic`;
    const rule = { limit: 3, windowSeconds: 60 };

    for (let i = 0; i < 3; i++) {
      await expect(consumeRateLimit(key, rule)).resolves.toBeUndefined();
    }
    const error = await consumeRateLimit(key, rule).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(RateLimitedError);
    expect((error as RateLimitedError).status).toBe(429);
    expect((error as RateLimitedError).retryAfterSeconds).toBeGreaterThanOrEqual(1);
    expect((error as RateLimitedError).retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("Claves distintas no se afectan entre sí", async () => {
    const rule = { limit: 1, windowSeconds: 60 };
    await consumeRateLimit(`test:${TAG}:a`, rule);

    await expect(consumeRateLimit(`test:${TAG}:b`, rule)).resolves.toBeUndefined();
  });

  it("Al terminar la ventana el contador vuelve a empezar", async () => {
    const key = `test:${TAG}:window`;
    const rule = { limit: 1, windowSeconds: 60 };
    await consumeRateLimit(key, rule);
    await expect(consumeRateLimit(key, rule)).rejects.toBeInstanceOf(RateLimitedError);

    await prisma.$executeRaw`UPDATE rate_limits SET window_start = now() - interval '2 minutes' WHERE key = ${key}`;

    await expect(consumeRateLimit(key, rule)).resolves.toBeUndefined();
  });

  it("Peticiones simultáneas: el contador es atómico", async () => {
    const key = `test:${TAG}:concurrent`;
    const rule = { limit: 5, windowSeconds: 60 };

    const results = await Promise.allSettled(
      Array.from({ length: 12 }, () => consumeRateLimit(key, rule)),
    );

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(5);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(7);
  });

  it("No guarda el email en claro: la clave lleva su hash", async () => {
    const email = `${TAG}-privado@example.com`;
    await consumeLoginRateLimit(new Headers({ "x-forwarded-for": ip("hash") }), email);

    const rows = await prisma.$queryRaw<{ key: string }[]>`
      SELECT key FROM rate_limits WHERE key LIKE ${`login:${ip("hash")}:%`}`;

    expect(rows).toHaveLength(1);
    expect(rows[0].key).toContain(hashKeyPart(email));
    expect(rows[0].key).not.toContain(email);
  });
});

describe("POST /api/auth/token", () => {
  const attempt = (password: string, forwardedFor: string) =>
    postToken(jsonRequest("/api/auth/token", { email: user.email, password }, forwardedFor));

  it("Más de 10 intentos por minuto: 429 con Retry-After, aunque la contraseña sea correcta", async () => {
    const address = ip("token");
    for (let i = 0; i < RATE_LIMITS.loginAccount.limit; i++) {
      expect((await attempt("incorrecta", address)).status).toBe(401);
    }

    const blocked = await attempt(PASSWORD, address);

    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("Retry-After"))).toBeGreaterThanOrEqual(1);
    expect(await blocked.json()).toMatchObject({ error: { code: "RATE_LIMITED" } });
  });

  it("Otra IP no queda bloqueada", async () => {
    const response = await attempt(PASSWORD, ip("token-otra"));

    expect(response.status).toBe(200);
  });

  it("Uso normal: un inicio de sesión correcto no se limita", async () => {
    const response = await attempt(PASSWORD, ip("token-normal"));

    expect(response.status).toBe(200);
    expect(await response.json()).toHaveProperty("token");
  });
});

describe("POST /api/auth/callback/credentials (inicio de sesión web)", () => {
  it("Al superar el límite responde 429 con la url que lee signIn y Retry-After", async () => {
    const address = ip("web");
    const email = `${TAG}web@example.com`;
    for (let i = 0; i < RATE_LIMITS.loginAccount.limit; i++) {
      await consumeLoginRateLimit(new Headers({ "x-forwarded-for": address }), email);
    }

    const request = new NextRequest("http://localhost/api/auth/callback/credentials", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "x-forwarded-for": address,
      },
      body: new URLSearchParams({ email, password: PASSWORD }).toString(),
    });
    const response = await postNextAuth(request);

    expect(response.status).toBe(429);
    expect(Number(response.headers.get("Retry-After"))).toBeGreaterThanOrEqual(1);
    const body = (await response.json()) as { url: string };
    expect(new URL(body.url).searchParams.get("code")).toBe("rate_limited");
  });
});

describe("POST /api/register", () => {
  it("Supera el límite por IP: 429 y no procesa la petición", async () => {
    const address = ip("register");
    for (let i = 0; i < RATE_LIMITS.register.limit; i++) {
      // Cuerpo vacío: 400 de validación, pero la petición cuenta.
      expect((await postRegister(jsonRequest("/api/register", {}, address))).status).toBe(400);
    }

    const blocked = await postRegister(jsonRequest("/api/register", {}, address));

    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).not.toBeNull();
  });
});

describe("PUT /api/users/[id]/friendship", () => {
  it("Más de 30 solicitudes en una hora: 429 y no se crean más", async () => {
    const missing = "00000000-0000-0000-0000-000000000000";
    const call = () =>
      putFriendship(new Request(`http://localhost/api/users/${missing}/friendship`), {
        params: Promise.resolve({ id: missing }),
      });

    for (let i = 0; i < RATE_LIMITS.friendRequest.limit; i++) {
      // Persona inexistente: 404, pero la solicitud cuenta.
      expect((await call()).status).toBe(404);
    }

    const blocked = await call();

    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).not.toBeNull();
    expect(await prisma.friendRequest.count({ where: { requesterId: user.id } })).toBe(0);
  });
});

describe("AuthService.verifyCredentials sin pistas (S-04)", () => {
  it("Con un email inexistente compara igualmente con un hash de bcrypt", async () => {
    const compare = vi.spyOn(bcrypt, "compare");

    const result = await AuthService.verifyCredentials(`${TAG}-no-existe@example.com`, "x");

    expect(result).toBeNull();
    expect(compare).toHaveBeenCalledTimes(1);
    expect(String(compare.mock.calls[0][1])).toMatch(/^\$2[aby]\$12\$/);
    compare.mockRestore();
  });

  it("Contraseña incorrecta y email inexistente devuelven lo mismo", async () => {
    const wrongPassword = await AuthService.verifyCredentials(user.email, "mala-contraseña");
    const unknownEmail = await AuthService.verifyCredentials(`${TAG}-otro@example.com`, "x");

    expect(wrongPassword).toBeNull();
    expect(unknownEmail).toBeNull();
  });

  it("Credenciales correctas siguen funcionando", async () => {
    const result = await AuthService.verifyCredentials(user.email, PASSWORD);

    expect(result).toMatchObject({ id: user.id });
  });
});
