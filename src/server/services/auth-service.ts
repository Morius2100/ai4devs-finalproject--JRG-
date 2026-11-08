import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { ConflictError } from "@/server/errors";
import type { RegisterInput } from "@/lib/validation/auth";

const BCRYPT_COST = 12;

// Hash bcrypt (coste 12) de una contraseña que nadie usa, para igualar tiempos en el login.
const DUMMY_PASSWORD_HASH = "$2b$12$b5SJTqPmn/pcki3.yfvO5Oj/kSVxi7.srw3DbCRBhg3VUJ6WPMbE.";

export type PublicUser = {
  id: string;
  username: string;
  email: string;
};

/**
 * Registro e inicio de sesión de usuarios (TKT-006).
 * La contraseña nunca sale de este servicio: ni en `PublicUser` ni en logs.
 */
export const AuthService = {
  async register(input: RegisterInput): Promise<PublicUser> {
    const username = input.username.trim().toLowerCase();
    const email = input.email.trim().toLowerCase();

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictError("El nombre de usuario o el email ya están registrados");
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);

    try {
      const user = await prisma.user.create({
        data: { username, email, passwordHash },
        select: { id: true, username: true, email: true },
      });
      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictError("El nombre de usuario o el email ya están registrados");
      }
      throw error;
    }
  },

  /**
   * Verifica email y contraseña. Devuelve `null` (nunca lanza) si las
   * credenciales no son correctas, para que el llamador muestre siempre el
   * mismo mensaje genérico sin revelar cuál de los dos datos falla.
   */
  async verifyCredentials(email: string, password: string): Promise<PublicUser | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    // Se compara siempre con un hash, real o ficticio: la respuesta tarda lo
    // mismo si el email no existe y no delata qué cuentas hay (S-04).
    const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!user || !valid) {
      return null;
    }

    return { id: user.id, username: user.username, email: user.email };
  },
};
