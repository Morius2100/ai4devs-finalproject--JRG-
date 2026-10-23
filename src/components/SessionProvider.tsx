"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { isNativeApp } from "@/lib/platform/native";

/** Solo en la web: en la app pediría `/api/auth/session` al origen local (design.md D5). */
export function SessionProvider({ children }: { children: ReactNode }) {
  if (isNativeApp()) {
    return children;
  }
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
