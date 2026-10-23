"use client";

import { useEffect, useRef, useState } from "react";
import type { VoteValue } from "@/components/topics/VoteButtons";

const MAX_LENGTH = 500;

/**
 * Diálogo de justificación del voto (TKT-021): accesible (`role="dialog"`,
 * foco atrapado, `Esc` cancela), justificación opcional con contador y
 * "Cancelar"/"Votar". No registra nada por sí mismo: delega en `onConfirm`.
 */
export function JustificationDialog({
  value,
  isSubmitting = false,
  errorMessage = null,
  onCancel,
  onConfirm,
}: {
  value: VoteValue;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onCancel: () => void;
  onConfirm: (justification: string) => void;
}) {
  const [text, setText] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), textarea, [href], input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const trimmedLength = text.trim().length;
  const tooLong = trimmedLength > MAX_LENGTH;

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/50 sm:items-center">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="justification-dialog-title"
        className="w-full max-w-md rounded-t-3xl bg-surface p-5 sm:rounded-3xl"
      >
        <h2 id="justification-dialog-title" className="text-xl font-extrabold">
          {value === "UP" ? "Votar a favor" : "Votar en contra"}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">Puedes explicar tu voto (opcional).</p>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={4}
          aria-label="Justificación"
          className="mt-3 w-full resize-none rounded-2xl border-2 border-transparent bg-surface-muted p-3 text-ink focus:border-brand-green focus:outline-none"
        />
        <div className="mt-1 flex items-center justify-between text-xs">
          <span className={tooLong ? "text-red-600" : "text-ink-muted"}>
            {trimmedLength}/{MAX_LENGTH}
          </span>
          {errorMessage ? (
            <span role="alert" className="text-red-600">
              {errorMessage}
            </span>
          ) : null}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(text)}
            disabled={isSubmitting || tooLong}
            className={`inline-flex min-h-11 items-center justify-center rounded-full px-6 font-bold text-white disabled:opacity-50 ${
              value === "UP" ? "bg-green-700" : "bg-red-600"
            }`}
          >
            {isSubmitting ? "Votando…" : "Votar"}
          </button>
        </div>
      </div>
    </div>
  );
}
