import { signIn, signOut } from "next-auth/react";
import { apiFetch } from "@/lib/platform/api-fetch";
import { isNativeApp } from "@/lib/platform/native";
import { tokenStore } from "@/lib/platform/token-store";

/** Demasiados intentos de inicio de sesión (límite de intentos, S-03). */
export class TooManyAttemptsError extends Error {
  constructor() {
    super("Demasiados intentos. Espera un momento e inténtalo de nuevo.");
    this.name = "TooManyAttemptsError";
  }
}

/**
 * Sesión en el cliente (TKT-044, design.md D5): cookie de Auth.js en la web
 * y token Bearer guardado en el dispositivo en la app. Devuelve `false` si
 * las credenciales no son correctas.
 */
export async function login(email: string, password: string): Promise<boolean> {
  if (!isNativeApp()) {
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.status === 429 || result?.code === "rate_limited") {
      throw new TooManyAttemptsError();
    }
    return !result?.error;
  }

  const response = await apiFetch("/api/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (response.status === 401) {
    return false;
  }
  if (response.status === 429) {
    throw new TooManyAttemptsError();
  }
  if (!response.ok) {
    throw new Error("No se pudo iniciar sesión");
  }
  const { token } = (await response.json()) as { token: string };
  await tokenStore.set(token);
  return true;
}

/** Cierra la sesión. En la web, Auth.js redirige a `/login`; en la app lo hace quien llama. */
export async function logout(): Promise<void> {
  if (!isNativeApp()) {
    await signOut({ callbackUrl: "/login" });
    return;
  }
  await tokenStore.clear();
}

/** `true` si hay sesión guardada en la app. En la web lo garantiza el middleware. */
export async function hasSession(): Promise<boolean> {
  if (!isNativeApp()) {
    return true;
  }
  return (await tokenStore.get()) !== null;
}
