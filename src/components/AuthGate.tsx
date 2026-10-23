"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { hasSession } from "@/lib/auth/client";
import { UNAUTHORIZED_EVENT } from "@/lib/platform/events";
import { isNativeApp } from "@/lib/platform/native";

/**
 * Protección de pantallas en la app (TKT-044, spec `app-movil`): sin token,
 * o cuando la API responde `401`, lleva a `/login`. En la web no hace nada:
 * protege el middleware.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(!isNativeApp());

  useEffect(() => {
    if (!isNativeApp()) {
      return;
    }
    let active = true;
    hasSession().then((ok) => {
      if (!active) return;
      if (ok) {
        setAllowed(true);
      } else {
        router.replace("/login");
      }
    });

    const onUnauthorized = () => router.replace("/login");
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => {
      active = false;
      window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    };
  }, [router]);

  return allowed ? children : null;
}
