import { prisma } from "@/server/db/client";
import { NotFoundError, ValidationError } from "@/server/errors";
import { userIdSchema } from "@/lib/validation/users";

/**
 * Amistades (TKT-028, TKT-036). La amistad es simétrica y se guarda en dos
 * filas (docs/03-modelo-datos.md §3.3), así que para leer basta con mirar
 * en un solo sentido. Desde F-07 se añade y se quita directamente, sin
 * solicitud ni aceptación (Q-01 resuelta): `add` y `remove` escriben las
 * dos filas en una transacción y son idempotentes.
 */
export const FriendshipService = {
  async areFriends(userId: string, otherId: string): Promise<boolean> {
    const friendship = await prisma.friendship.findUnique({
      where: { userId_friendId: { userId, friendId: otherId } },
      select: { userId: true },
    });
    return friendship !== null;
  },

  async getFriendIds(userId: string): Promise<string[]> {
    const friendships = await prisma.friendship.findMany({
      where: { userId },
      select: { friendId: true },
    });
    return friendships.map((friendship) => friendship.friendId);
  },

  /**
   * Hace amigos a `userId` y `friendId` en ambos sentidos. Repetirlo no
   * duplica filas ni falla. `ValidationError` si son la misma persona;
   * `NotFoundError` si `friendId` no es un UUID o no existe.
   */
  async add(userId: string, friendId: string): Promise<{ isFriend: true }> {
    await assertCanChangeFriendship(userId, friendId);

    await prisma.friendship.createMany({
      data: [
        { userId, friendId },
        { userId: friendId, friendId: userId },
      ],
      skipDuplicates: true,
    });
    return { isFriend: true };
  },

  /**
   * Deshace la amistad en ambos sentidos. Repetirlo no falla. Mismos errores
   * que `add`.
   */
  async remove(userId: string, friendId: string): Promise<{ isFriend: false }> {
    await assertCanChangeFriendship(userId, friendId);

    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });
    return { isFriend: false };
  },
};

async function assertCanChangeFriendship(userId: string, friendId: string): Promise<void> {
  if (!userIdSchema.safeParse(friendId).success) {
    throw new NotFoundError("Persona no encontrada");
  }
  if (userId === friendId) {
    throw new ValidationError("No puedes ser tu propio amigo");
  }

  const target = await prisma.user.findUnique({ where: { id: friendId }, select: { id: true } });
  if (!target) {
    throw new NotFoundError("Persona no encontrada");
  }
}
