import { afterEach, describe, expect, it, vi } from "vitest";

// `trustHost` (S-08): confiar en la cabecera Host solo donde corresponde.
async function trustHostWith(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const name of ["VERCEL", "AUTH_TRUST_HOST", "NODE_ENV"]) {
    vi.stubEnv(name, env[name] as string);
    if (env[name] === undefined) {
      delete process.env[name];
    }
  }
  const { authConfig } = await import("@/server/auth/config");
  return authConfig.trustHost;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("authConfig.trustHost", () => {
  it("En producción fuera de Vercel y sin petición expresa: no confía en el host", async () => {
    expect(await trustHostWith({ NODE_ENV: "production" })).toBe(false);
  });

  it("En Vercel: confía en el host que fija la plataforma", async () => {
    expect(await trustHostWith({ NODE_ENV: "production", VERCEL: "1" })).toBe(true);
  });

  it("Con AUTH_TRUST_HOST=true: confía (p. ej. next start en local)", async () => {
    expect(await trustHostWith({ NODE_ENV: "production", AUTH_TRUST_HOST: "true" })).toBe(true);
  });

  it("Otros valores de AUTH_TRUST_HOST no cuentan", async () => {
    expect(await trustHostWith({ NODE_ENV: "production", AUTH_TRUST_HOST: "1" })).toBe(false);
  });

  it("En desarrollo y pruebas: confía", async () => {
    expect(await trustHostWith({ NODE_ENV: "development" })).toBe(true);
    expect(await trustHostWith({ NODE_ENV: "test" })).toBe(true);
  });
});
