"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ApiError, deleteTopic } from "@/lib/api/topics";

/** Papelera en SVG de trazo; hereda el color del texto (mismo estilo que `ThumbIcon`). */
function TrashIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

/**
 * Botón de papelera de la pantalla de un tema propio (HU-23, TKT-088). Solo se
 * monta si `isAuthor`; el servidor vuelve a comprobar la autoría al borrar.
 * Abre un diálogo de confirmación accesible (`role="alertdialog"`, foco inicial en
 * «Cancelar», foco atrapado, `Esc` cancela). Al borrar (o si el tema ya no existe,
 * `404`) marca las listas como desactualizadas y vuelve a la pantalla de temas.
 */
export function DeleteTopicButton({ topicId }: { topicId: string }) {
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  function finish() {
    // El detalle queda obsoleto (sin refetch inmediato, que daría 404 en esta pantalla).
    queryClient.invalidateQueries({ queryKey: ["topic", topicId], refetchType: "none" });
    queryClient.invalidateQueries({ queryKey: ["topics"] });
    queryClient.invalidateQueries({ queryKey: ["user-topics"] });
    queryClient.invalidateQueries({ queryKey: ["stories"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    router.replace("/");
  }

  const mutation = useMutation({
    mutationFn: () => deleteTopic(topicId),
    onSuccess: finish,
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 404) {
        finish();
        return;
      }
      setErrorMessage(error instanceof ApiError ? error.message : "No se ha podido borrar el tema");
    },
  });

  const isPending = mutation.isPending;

  function close() {
    setOpen(false);
    setErrorMessage(null);
    triggerRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!isPending) close();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled)");
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
  }, [open, isPending]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Borrar tema"
        onClick={() => setOpen(true)}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-muted text-red-600 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
      >
        <TrashIcon />
      </button>

      {open ? (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/50 sm:items-center">
          <div
            ref={dialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-topic-title"
            aria-describedby="delete-topic-description"
            className="w-full max-w-md rounded-t-3xl bg-surface p-5 sm:rounded-3xl"
          >
            <h2 id="delete-topic-title" className="text-xl font-extrabold">
              ¿Borrar este tema?
            </h2>
            <p id="delete-topic-description" className="mt-1 text-sm text-ink-muted">
              Se borrarán también sus votos y opiniones. No se puede deshacer.
            </p>
            {errorMessage ? (
              <p role="alert" className="mt-3 text-sm text-red-600">
                {errorMessage}
              </p>
            ) : null}
            <div className="mt-4 flex justify-end gap-2">
              <button
                ref={cancelRef}
                type="button"
                onClick={close}
                disabled={isPending}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  mutation.mutate();
                }}
                disabled={isPending}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-red-600 px-6 font-bold text-white disabled:opacity-50"
              >
                {isPending ? "Borrando…" : "Borrar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
