import { describe, expect, it } from "vitest";
import { registerSchema } from "@/lib/validation/auth";
import { clientIp, hashKeyPart } from "@/server/rate-limit";

const valid = { username: "ana_01", email: "ana@example.com" };

describe("registerSchema: contraseña acotada (S-09)", () => {
  it("Acepta de 8 a 72 caracteres", () => {
    expect(registerSchema.safeParse({ ...valid, password: "a".repeat(8) }).success).toBe(true);
    expect(registerSchema.safeParse({ ...valid, password: "a".repeat(72) }).success).toBe(true);
  });

  it("Rechaza menos de 8", () => {
    const result = registerSchema.safeParse({ ...valid, password: "a".repeat(7) });

    expect(result.success).toBe(false);
  });

  it("Rechaza más de 72 con un error en password", () => {
    const result = registerSchema.safeParse({ ...valid, password: "a".repeat(73) });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password?.[0]).toBe(
        "La contraseña no puede superar los 72 caracteres",
      );
    }
  });

  it("Cuenta bytes: 40 caracteres de 2 bytes superan el límite de bcrypt", () => {
    expect(registerSchema.safeParse({ ...valid, password: "ñ".repeat(36) }).success).toBe(true);
    expect(registerSchema.safeParse({ ...valid, password: "ñ".repeat(40) }).success).toBe(false);
  });

  it("Una contraseña de 200 caracteres se rechaza", () => {
    expect(registerSchema.safeParse({ ...valid, password: "x".repeat(200) }).success).toBe(false);
  });
});

describe("clientIp y hashKeyPart", () => {
  it("Usa la primera IP de x-forwarded-for", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe(
      "203.0.113.7",
    );
  });

  it("Recurre a x-real-ip y, sin cabeceras, a «unknown»", () => {
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(clientIp(new Headers())).toBe("unknown");
  });

  it("El hash ignora mayúsculas y espacios, y no contiene el valor", () => {
    expect(hashKeyPart("  Ana@Example.com ")).toBe(hashKeyPart("ana@example.com"));
    expect(hashKeyPart("ana@example.com")).not.toContain("ana");
    expect(hashKeyPart("ana@example.com")).toHaveLength(32);
  });
});
