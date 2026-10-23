"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { hasSession, logout } from "@/lib/auth/client";
import {
  checkServer,
  currentServerUrl,
  defaultServerUrl,
  normalizeServerUrl,
  resetServer,
  setServer,
} from "@/lib/platform/server-store";

/**
 * Formulario de servidor de la app de desarrollo (HU-22), compartido por `/servidor`
 * y la pantalla «Sin conexión»: muestra el servidor en uso y deja cambiarlo sin
 * recompilar. Antes de guardar comprueba que responde (`/api/health`). Cambiar de
 * servidor cierra la sesión, vacía la caché y lleva al inicio de sesión, porque el
 * token es del servidor anterior; después llama a `onSwitched`.
 */
export function ServerForm({
  onCancel,
  onSwitched,
}: {
  onCancel: () => void;
  onSwitched?: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [current, setCurrent] = useState(() => currentServerUrl());
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function switchTo(apply: () => Promise<void>, next: string) {
    if (next === current) {
      setNotice("Ya estás usando este servidor.");
      return;
    }
    const hadSession = await hasSession();
    await apply();
    if (hadSession) {
      await logout();
    }
    queryClient.clear();
    setCurrent(next);
    router.replace("/login");
    onSwitched?.();
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const normalized = normalizeServerUrl(input);
    if (!normalized) {
      setError("La dirección no es válida. Escribe algo como http://192.168.1.10:3000");
      return;
    }

    setBusy(true);
    try {
      if (normalized !== current && !(await checkServer(normalized))) {
        setError("No se puede conectar con ese servidor");
        return;
      }
      await switchTo(() => setServer(normalized), normalized);
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      await switchTo(resetServer, defaultServerUrl());
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSave} noValidate className="flex flex-col gap-4">
      <p className="text-sm text-ink-muted">
        En uso: <span className="break-all font-bold text-ink">{current || "mismo servidor"}</span>
      </p>

      <div className="flex flex-col gap-1">
        <label htmlFor="server" className="text-sm font-bold">
          Dirección del servidor
        </label>
        <input
          id="server"
          type="url"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="http://192.168.1.10:3000"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={busy}
          className="field"
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="text-sm text-ink-muted">
          {notice}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "Comprobando…" : "Guardar"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleReset()}
          className="btn-secondary w-full"
        >
          Restablecer
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary w-full">
          Volver
        </button>
      </div>
    </form>
  );
}
