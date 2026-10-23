"use client";

import { ServerForm } from "@/components/native/ServerForm";
import { currentServerUrl, isServerConfigurable } from "@/lib/platform/server-store";

/** `network`: el móvil no tiene red. `server`: hay red, pero la API no responde. */
export type OfflineReason = "network" | "server";

const MESSAGES: Record<OfflineReason, string> = {
  network:
    "Comprueba tu conexión a Internet. Opina volverá a cargar la pantalla en cuanto haya red.",
  server:
    "No se puede conectar con el servidor de Opina. Volveremos a cargar la pantalla en cuanto responda.",
};

/**
 * Pantalla «Sin conexión» de la app (TKT-047): se superpone para no perder el estado de la pantalla.
 * En el build de desarrollo (HU-22, CA-22.5) enseña el servidor en uso y deja cambiarlo con
 * `ServerForm`, para no quedar bloqueado si ese servidor no responde. `NativeShell` guarda si
 * se está editando, para pausar los reintentos automáticos mientras tanto.
 */
export function OfflineScreen({
  reason,
  onRetry,
  retrying,
  editingServer = false,
  onEditServer,
  onCancelEdit,
  onServerSwitched,
}: {
  reason: OfflineReason;
  onRetry: () => void;
  retrying: boolean;
  editingServer?: boolean;
  onEditServer?: () => void;
  onCancelEdit?: () => void;
  onServerSwitched?: () => void;
}) {
  const canChangeServer = isServerConfigurable() && onEditServer !== undefined;

  return (
    <div
      role="alertdialog"
      aria-labelledby="offline-title"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 overflow-y-auto bg-surface px-6 text-center"
    >
      <h1 id="offline-title" className="text-2xl font-extrabold">
        Sin conexión
      </h1>
      {canChangeServer && editingServer ? (
        <div className="w-full max-w-sm text-left">
          <ServerForm onCancel={() => onCancelEdit?.()} onSwitched={onServerSwitched} />
        </div>
      ) : (
        <>
          <p className="text-sm text-ink-muted">{MESSAGES[reason]}</p>
          <button type="button" onClick={onRetry} disabled={retrying} className="btn-primary">
            {retrying ? "Reintentando…" : "Reintentar"}
          </button>
          {canChangeServer ? (
            <>
              <p className="text-xs text-ink-muted">
                Servidor:{" "}
                <span className="break-all">
                  {currentServerUrl().replace(/^https?:\/\//, "") || "mismo servidor"}
                </span>
              </p>
              <button type="button" onClick={onEditServer} className="btn-secondary">
                Cambiar servidor
              </button>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
