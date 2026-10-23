"use client";

import Link from "next/link";
import { login } from "@/lib/auth/client";
import { currentServerUrl, isServerConfigurable } from "@/lib/platform/server-store";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

/**
 * Pantalla de inicio de sesión (TKT-007, HU-00 CA-00.3/CA-00.4).
 * Mensaje de error genérico: no revela si falla el email o la contraseña.
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (!(await login(email, password))) {
        setError("Credenciales incorrectas");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("No se pudo iniciar sesión. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-bold">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="field"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-bold">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="field"
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? "Entrando…" : "Iniciar sesión"}
      </button>

      <p className="text-center text-sm text-ink-muted">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-bold text-brand-green-strong underline">
          Regístrate
        </Link>
      </p>

      {isServerConfigurable() ? (
        <p className="text-center text-xs text-ink-muted">
          Servidor:{" "}
          <span className="break-all">{currentServerUrl().replace(/^https?:\/\//, "")}</span>
          {" · "}
          <Link href="/servidor" className="font-bold text-brand-green-strong underline">
            Cambiar
          </Link>
        </p>
      ) : null}
    </form>
  );
}
