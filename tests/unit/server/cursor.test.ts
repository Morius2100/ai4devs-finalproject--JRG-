import { describe, expect, it } from "vitest";
import { z } from "zod";
import { decodeCursor, encodeCursor } from "@/server/cursor";
import { ValidationError } from "@/server/errors";

const cursorSchema = z.tuple([z.number(), z.string()]);

describe("encodeCursor / decodeCursor", () => {
  it("codifica y decodifica un cursor válido", () => {
    const cursor = encodeCursor([42, "topic-id"]);
    expect(decodeCursor(cursor, cursorSchema)).toEqual([42, "topic-id"]);
  });

  it("produce una cadena base64url opaca (sin JSON en claro)", () => {
    const cursor = encodeCursor([1, "abc"]);
    expect(cursor).not.toContain("{");
    expect(cursor).not.toContain('"');
    expect(cursor).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("rechaza un cursor que no es base64url válido con ValidationError", () => {
    expect(() => decodeCursor("no es base64!!", cursorSchema)).toThrow(ValidationError);
  });

  it("rechaza un cursor que decodifica a JSON corrupto", () => {
    const garbage = Buffer.from("{not json", "utf8").toString("base64url");
    expect(() => decodeCursor(garbage, cursorSchema)).toThrow(ValidationError);
  });

  it("rechaza un cursor cuyo contenido no cumple el esquema", () => {
    const wrongShape = encodeCursor(["no-es-numero", "topic-id"]);
    expect(() => decodeCursor(wrongShape, cursorSchema)).toThrow(ValidationError);
  });
});
