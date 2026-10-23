import { describe, expect, it } from "vitest";
import { formatRelativeDate } from "@/lib/format/relative-date";

// «Hoy» fijo: 30 de septiembre de 2026, 12:00 (hora local).
const NOW = new Date(2026, 8, 30, 12, 0, 0);
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe("formatRelativeDate (TKT-052)", () => {
  it.each([
    [0, "ahora"],
    [59_000, "ahora"],
    [MIN, "hace 1 min"],
    [5 * MIN, "hace 5 min"],
    [59 * MIN, "hace 59 min"],
    [HOUR, "hace 1 h"],
    [3 * HOUR, "hace 3 h"],
    [23 * HOUR + 59 * MIN, "hace 23 h"],
    [DAY, "hace 1 d"],
    [2 * DAY, "hace 2 d"],
    [6 * DAY + 23 * HOUR, "hace 6 d"],
  ])("hace %i ms → %s", (elapsed, expected) => {
    expect(formatRelativeDate(ago(elapsed), NOW)).toBe(expected);
  });

  it("A partir de 7 días: día y mes abreviado del mismo año", () => {
    expect(formatRelativeDate(new Date(2026, 8, 12, 9, 0).toISOString(), NOW)).toBe("12 sept");
    expect(formatRelativeDate(ago(7 * DAY), NOW)).toBe("23 sept");
  });

  it("De otro año: incluye el año", () => {
    expect(formatRelativeDate(new Date(2025, 2, 3, 9, 0).toISOString(), NOW)).toBe("3 mar 2025");
  });

  it("Reloj del cliente adelantado: cuenta como «ahora»", () => {
    expect(formatRelativeDate(new Date(NOW.getTime() + 5 * MIN).toISOString(), NOW)).toBe("ahora");
  });
});
