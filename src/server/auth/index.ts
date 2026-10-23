import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { authConfig } from "@/server/auth/config";
import { loginSchema } from "@/lib/validation/auth";
import { AuthService } from "@/server/services/auth-service";

/**
 * Instancia completa de Auth.js v5, con el proveedor Credentials (TKT-006).
 * Solo se importa desde código que corre en Node.js (Route Handlers, Server
 * Actions, Server Components): usa bcrypt y Prisma, incompatibles con Edge.
 */
const fullConfig = {
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }
        const user = await AuthService.verifyCredentials(parsed.data.email, parsed.data.password);
        if (!user) {
          return null;
        }
        return user;
      },
    }),
  ],
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(fullConfig);
