import { describe, expect, it } from "vitest";
import config, { securityHeaders } from "../../../next.config";

const header = (name: string) => securityHeaders.find((entry) => entry.key === name)?.value;

describe("Cabeceras de seguridad HTTP (S-06)", () => {
  it("Se aplican a todas las rutas de la web", async () => {
    const rules = await config.headers!();

    expect(rules).toHaveLength(1);
    expect(rules[0].source).toBe("/(.*)");
    expect(rules[0].headers).toBe(securityHeaders);
  });

  it("Incluye todas las cabeceras exigidas por la spec", () => {
    for (const name of [
      "Content-Security-Policy",
      "X-Content-Type-Options",
      "Referrer-Policy",
      "Permissions-Policy",
    ]) {
      expect(header(name), name).toBeDefined();
    }
    expect(header("X-Content-Type-Options")).toBe("nosniff");
    expect(header("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("La CSP impide el embebido, los plugins y los destinos externos de formularios", () => {
    const csp = header("Content-Security-Policy")!;

    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("connect-src 'self'");
  });

  it("Permissions-Policy desactiva cámara, micrófono y ubicación", () => {
    const policy = header("Permissions-Policy")!;

    expect(policy).toContain("camera=()");
    expect(policy).toContain("microphone=()");
    expect(policy).toContain("geolocation=()");
  });
});
