const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const dayMonth = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" });
const dayMonthYear = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/**
 * Fecha corta de una tarjeta de tema (TKT-052): relativa si es reciente
 * («ahora», «hace 5 min», «hace 3 h», «hace 2 d») y día y mes abreviado a
 * partir de 7 días («12 sept», con el año si no es el actual).
 */
export function formatRelativeDate(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  // Un reloj de cliente adelantado puede dar una diferencia negativa: cuenta como «ahora».
  const elapsed = Math.max(0, now.getTime() - date.getTime());

  if (elapsed < MINUTE) return "ahora";
  if (elapsed < HOUR) return `hace ${Math.floor(elapsed / MINUTE)} min`;
  if (elapsed < DAY) return `hace ${Math.floor(elapsed / HOUR)} h`;
  if (elapsed < 7 * DAY) return `hace ${Math.floor(elapsed / DAY)} d`;

  return date.getFullYear() === now.getFullYear()
    ? dayMonth.format(date)
    : dayMonthYear.format(date);
}
