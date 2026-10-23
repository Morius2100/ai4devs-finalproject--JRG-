"use client";

import { ThumbIcon } from "@/components/topics/ThumbIcon";

export type VoteValue = "UP" | "DOWN";

const blockClass =
  "flex h-28 flex-col items-center justify-center gap-1 rounded-3xl border-2 text-lg font-extrabold transition-colors";

/**
 * Bloques de voto fijos en la parte inferior (TKT-017): pulgar arriba
 * verde "A favor" y pulgar abajo rojo "En contra", con `aria-label` para
 * no depender solo del color.
 */
export function VoteButtons({ onSelect }: { onSelect?: (value: VoteValue) => void }) {
  return (
    <div className="sticky bottom-0 grid grid-cols-2 gap-3 bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_16px_-12px_rgba(0,0,0,0.25)]">
      <button
        type="button"
        aria-label="Votar a favor"
        onClick={() => onSelect?.("UP")}
        className={`${blockClass} border-green-600 bg-green-50 text-green-800 hover:bg-green-600 hover:text-white active:bg-green-600 active:text-white dark:bg-green-950/40 dark:text-green-300`}
      >
        <ThumbIcon direction="up" className="h-8 w-8" />A favor
      </button>
      <button
        type="button"
        aria-label="Votar en contra"
        onClick={() => onSelect?.("DOWN")}
        className={`${blockClass} border-red-600 bg-red-50 text-red-800 hover:bg-red-600 hover:text-white active:bg-red-600 active:text-white dark:bg-red-950/40 dark:text-red-300`}
      >
        <ThumbIcon direction="down" className="h-8 w-8" />
        En contra
      </button>
    </div>
  );
}
