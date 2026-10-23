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
  // Despliegue autoalojado (no Vercel): confiar en el host de la petición.
  // En producción detrás de un proxy, fijarlo con la variable AUTH_URL.
  trustHost: true,
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
