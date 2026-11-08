import type { NextAuthConfig } from "next-auth";

export const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60;

/**
 * Configuración "edge-safe" de Auth.js v5 (TKT-006): sesión JWT con `id` y
 * `username` (design.md de fase-1-plataforma-base). Sin proveedores: estos
 * se añaden en `src/server/auth/index.ts`, que corre en Node.js (usa bcrypt
 * y Prisma). El middleware (TKT-008), que sí corre en Edge, importa
 * únicamente este archivo para leer la sesión sin arrastrar esas
 * dependencias.
 */
export const authConfig = {
  // Solo se confía en la cabecera `Host` donde la fija la plataforma (Vercel), en
  // desarrollo y pruebas, o si se pide expresamente con AUTH_TRUST_HOST=true
  // (p. ej. `next start` en local). En cualquier otro producción Auth.js rechaza
  // hosts no reconocidos; en Vercel conviene fijar además AUTH_URL (S-08).
  trustHost:
    Boolean(process.env.VERCEL) ||
    process.env.AUTH_TRUST_HOST === "true" ||
    process.env.NODE_ENV !== "production",
  session: {
    strategy: "jwt",
    maxAge: THIRTY_DAYS_IN_SECONDS,
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as { username: string }).username;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
