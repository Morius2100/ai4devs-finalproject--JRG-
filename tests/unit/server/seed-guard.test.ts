import { describe, expect, it } from "vitest";
import { seedBlockedReason } from "../../../scripts/seed-guard.mjs";

const blocked = seedBlockedReason as (env: Record<string, string | undefined>) => string | null;

describe("seedBlockedReason (S-02)", () => {
  it("Producción con RUN_SEED=1 y sin confirmación: bloquea y explica por qué", () => {
    const reason = blocked({ RUN_SEED: "1", VERCEL_ENV: "production" });

    expect(reason).toContain("RUN_SEED=1");
    expect(reason).toContain("ALLOW_PRODUCTION_SEED=1");
  });

  it("Producción con ALLOW_PRODUCTION_SEED=1: permite", () => {
    expect(
      blocked({ RUN_SEED: "1", VERCEL_ENV: "production", ALLOW_PRODUCTION_SEED: "1" }),
    ).toBeNull();
  });

  it("Valores distintos de «1» no cuentan como confirmación", () => {
    expect(
      blocked({ RUN_SEED: "1", VERCEL_ENV: "production", ALLOW_PRODUCTION_SEED: "true" }),
    ).not.toBeNull();
  });

  it("Sin RUN_SEED no hay nada que bloquear", () => {
    expect(blocked({ VERCEL_ENV: "production" })).toBeNull();
    expect(blocked({ RUN_SEED: "0", VERCEL_ENV: "production" })).toBeNull();
  });

  it("Vista previa y local: permite", () => {
    expect(blocked({ RUN_SEED: "1", VERCEL_ENV: "preview" })).toBeNull();
    expect(blocked({ RUN_SEED: "1" })).toBeNull();
  });
});
