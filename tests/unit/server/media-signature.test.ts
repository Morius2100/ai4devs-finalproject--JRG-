import { describe, expect, it } from "vitest";
import {
  SIGNED_URL_TTL_SECONDS,
  signMediaKey,
  toMediaUrl,
  verifyMediaSignature,
} from "@/server/media";

const KEY = "topics/00000000-0000-4000-8000-000000000001.png";
const NOW = Date.UTC(2026, 10, 8, 12, 0, 0);

describe("toMediaUrl con firma (TKT-084)", () => {
  it("Sin firma devuelve la ruta relativa de siempre", () => {
    expect(toMediaUrl(KEY)).toBe(`/api/media/${KEY}`);
  });

  it("Con firma añade exp y sig, y caduca a los 30 minutos", () => {
    const url = toMediaUrl(KEY, { signed: true, nowMs: NOW })!;
    const params = new URL(`http://localhost${url}`).searchParams;
    const exp = Number(params.get("exp"));

    expect(exp).toBe(Math.floor(NOW / 1000) + SIGNED_URL_TTL_SECONDS);
    expect(SIGNED_URL_TTL_SECONDS).toBe(1800);
    expect(params.get("sig")).toBe(signMediaKey(KEY, exp));
  });

  it("Las URLs externas no se firman ni cambian", () => {
    expect(toMediaUrl("https://picsum.photos/seed/x/200", { signed: true })).toBe(
      "https://picsum.photos/seed/x/200",
    );
    expect(toMediaUrl(null, { signed: true })).toBeNull();
  });
});

describe("verifyMediaSignature", () => {
  const exp = Math.floor(NOW / 1000) + 600;
  const sig = signMediaKey(KEY, exp);

  it("Acepta una firma vigente", () => {
    expect(verifyMediaSignature(KEY, String(exp), sig, NOW)).toBe(true);
  });

  it("Rechaza la firma caducada", () => {
    expect(verifyMediaSignature(KEY, String(exp), sig, NOW + 601_000)).toBe(false);
  });

  it("Rechaza la firma de otra clave o con otra caducidad", () => {
    expect(
      verifyMediaSignature(
        "topics/00000000-0000-4000-8000-000000000002.png",
        String(exp),
        sig,
        NOW,
      ),
    ).toBe(false);
    expect(verifyMediaSignature(KEY, String(exp + 1), sig, NOW)).toBe(false);
  });

  it("Rechaza valores ausentes o mal formados sin lanzar", () => {
    expect(verifyMediaSignature(KEY, null, sig, NOW)).toBe(false);
    expect(verifyMediaSignature(KEY, String(exp), null, NOW)).toBe(false);
    expect(verifyMediaSignature(KEY, "abc", sig, NOW)).toBe(false);
    expect(verifyMediaSignature(KEY, String(exp), "no-es-hex", NOW)).toBe(false);
    expect(verifyMediaSignature(KEY, String(exp), sig.slice(0, 10), NOW)).toBe(false);
  });
});
