import type { DefaultSession } from "next-auth";

/**
 * Ampliación de los tipos de Auth.js: la sesión y el JWT incluyen `id` y
 * `username` (design.md de fase-1-plataforma-base).
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    username: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
  }
}
