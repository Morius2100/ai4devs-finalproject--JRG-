"use client";

import Link from "next/link";
import { login } from "@/lib/auth/client";
import { apiFetch } from "@/lib/platform/api-fetch";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { registerSchema } from "@/lib/validation/auth";

type FieldErrors = Partial<Record<"username" | "email" | "password", string>>;

/**
 * Pantalla de registro (TKT-007, HU-00 CA-00.1/CA-00.2). Valida en cliente
 * con el mismo esquema que el servidor, crea la cuenta y, si todo va bien,
 * inicia sesión automáticamente y redirige a `/`.
 */
export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const parsed = registerSchema.safeParse({ username, email, password });
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        username: errors.username?.[0],
        email: errors.email?.[0],
        password: errors.password?.[0],
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiFetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        const body = (await response.json()) as {
          error: { code: string; message: string; fieldErrors?: Record<string, string[]> };
        };
        if (body.error.fieldErrors) {
          setFieldErrors({
            username: body.error.fieldErrors.username?.[0],
            email: body.error.fieldErrors.email?.[0],
            password: body.error.fieldErrors.password?.[0],
          });
        }
        if (body.error.code === "CONFLICT") {
          setFormError("El nombre de usuario o el email ya están registrados");
        } else if (!body.error.fieldErrors) {
          setFormError(body.error.message);
        }
        return;
      }

      if (!(await login(parsed.data.email, parsed.data.password))) {
        setFormError("La cuenta se creó, pero no se pudo iniciar sesión. Prueba a iniciar sesión.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setFormError("No se pudo completar el registro. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="username" className="text-sm font-bold">
          Nombre de usuario
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          aria-invalid={Boolean(fieldErrors.username)}
          aria-describedby={fieldErrors.username ? "username-error" : undefined}
          className="field"
        />
        {fieldErrors.username ? (
          <p id="username-error" className="text-sm text-red-600">
            {fieldErrors.username}
          </p>
        ) : null}
      </div>

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
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
          className="field"
        />
        {fieldErrors.email ? (
          <p id="email-error" className="text-sm text-red-600">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-bold">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={fieldErrors.password ? "password-error" : undefined}
          className="field"
        />
        {fieldErrors.password ? (
          <p id="password-error" className="text-sm text-red-600">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>

      {formError ? (
        <p role="alert" className="text-sm text-red-600">
          {formError}
        </p>
      ) : null}

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? "Creando cuenta…" : "Crear cuenta"}
      </button>

      <p className="text-center text-sm text-ink-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-bold text-brand-green-strong underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
