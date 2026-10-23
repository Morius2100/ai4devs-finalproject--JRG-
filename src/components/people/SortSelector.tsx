"use client";

import type { TopicSort } from "@/lib/validation/users";

const OPTIONS: Array<{ value: TopicSort; label: string }> = [
  { value: "recent", label: "Más recientes" },
  { value: "top", label: "Más puntuados" },
];

/**
 * Selector de orden de los temas del perfil (TKT-039, HU-14 CA-14.4):
 * control segmentado con dos botones; el activo se indica con
 * `aria-pressed`.
 */
export function SortSelector({
  value,
  onChange,
}: {
  value: TopicSort;
  onChange: (sort: TopicSort) => void;
}) {
  return (
    <div role="group" aria-label="Ordenar temas" className="flex rounded-full bg-surface-muted p-1">
      {OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`min-h-11 flex-1 rounded-full px-3 text-sm font-bold ${
              active ? "bg-surface text-ink shadow-sm" : "text-ink-muted"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
