import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/server/db/client";
import { AuthService } from "@/server/services/auth-service";
import { ConflictError } from "@/server/errors";
import { POST as registerRoute } from "@/app/api/register/route";

// Prefijo único por ejecución para no chocar con otras corridas en paralelo
// ni con los datos de `prisma/seed.ts`.
const RUN_ID = Date.now().toString(36);
const email = (local: string) => `${local}+${RUN_ID}@example.com`;
const username = (base: string) => `${base}${RUN_ID}`;

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: RUN_ID } } });
  await prisma.$disconnect();
});

describe("AuthService", () => {
  it("Registro correcto: crea la cuenta y no expone la contraseña", async () => {
    const input = { username: username("ana"), email: email("ana"), password: "password123" };

    const user = await AuthService.register(input);

    expect(user).toEqual({ id: expect.any(String), username: input.username, email: input.email });
    expect(user).not.toHaveProperty("password");
    expect(user).not.toHaveProperty("passwordHash");

    const stored = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(stored.passwordHash).not.toBe(input.password);
  });

  it("Nombre de usuario o email ya registrados: lanza ConflictError y no crea otra cuenta", async () => {
    const input = { username: username("bruno"), email: email("bruno"), password: "password123" };
    await AuthService.register(input);

    await expect(AuthService.register(input)).rejects.toBeInstanceOf(ConflictError);

    const count = await prisma.user.count({ where: { email: input.email } });
    expect(count).toBe(1);
  });

  it("Credenciales correctas: verifyCredentials devuelve el usuario", async () => {
    const input = { username: username("carla"), email: email("carla"), password: "password123" };
    await AuthService.register(input);

    const result = await AuthService.verifyCredentials(input.email, input.password);

    expect(result).toEqual({
      id: expect.any(String),
      username: input.username,
      email: input.email,
    });
  });

  it("Credenciales incorrectas: contraseña errónea devuelve null", async () => {
    const input = { username: username("dani"), email: email("dani"), password: "password123" };
    await AuthService.register(input);

    const result = await AuthService.verifyCredentials(input.email, "otra-contraseña");

    expect(result).toBeNull();
  });

  it("Credenciales incorrectas: email inexistente devuelve null", async () => {
    const result = await AuthService.verifyCredentials(email("no-existe"), "password123");
    expect(result).toBeNull();
  });
});

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/register", () => {
  it("Registro correcto: responde 201 con id y username, sin contraseña", async () => {
    const input = { username: username("elsa"), email: email("elsa"), password: "password123" };

    const response = await registerRoute(jsonRequest(input));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({ id: expect.any(String), username: input.username });
    expect(JSON.stringify(body)).not.toContain("password");
  });

  it("Nombre de usuario o email ya registrados: responde 409", async () => {
    const input = { username: username("felix"), email: email("felix"), password: "password123" };
    await registerRoute(jsonRequest(input));

    const response = await registerRoute(jsonRequest(input));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error.code).toBe("CONFLICT");
  });

  it("Datos de registro inválidos: responde 400 indicando los campos", async () => {
    const response = await registerRoute(
      jsonRequest({ username: "a", email: "no-es-un-email", password: "corta" }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(Object.keys(body.error.fieldErrors)).toEqual(
      expect.arrayContaining(["username", "email", "password"]),
    );
  });
});
