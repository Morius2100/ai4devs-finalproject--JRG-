import { ThumbIcon } from "@/components/topics/ThumbIcon";
import type { Opinion } from "@/server/services/vote-service";

/**
 * Opinión (voto con justificación) en la lista del tema (TKT-022): verde
 * para `UP`, rojo para `DOWN`, con icono para no depender solo del color.
 */
export function OpinionItem({ opinion }: { opinion: Opinion }) {
  const isUp = opinion.value === "UP";
  return (
    <li
      className={`rounded-2xl border-2 px-4 py-3 ${
        isUp
          ? "border-green-600 bg-green-50 dark:bg-green-950/30"
          : "border-red-600 bg-red-50 dark:bg-red-950/30"
      }`}
    >
      <p className="flex items-center gap-2 text-sm font-bold">
        <ThumbIcon
          direction={isUp ? "up" : "down"}
          className={`h-4 w-4 ${isUp ? "text-green-700" : "text-red-600"}`}
        />
        <span>{opinion.username}</span>
      </p>
      <p className="mt-1 text-sm text-ink">{opinion.justification}</p>
    </li>
  );
}
