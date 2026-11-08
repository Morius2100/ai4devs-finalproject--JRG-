import { prisma } from "@/server/db/client";
import { NotFoundError, ValidationError } from "@/server/errors";
import { userIdSchema } from "@/lib/validation/users";

/**
 * Estado de la relación entre quien mira y otra persona: `FRIENDS` (amistad
 * aceptada), `PENDING` (solicitud enviada por quien mira) o `NONE`.
 */
export type FriendshipStatus = "NONE" | "PENDING" | "FRIENDS";

export type FriendshipResult = { status: FriendshipStatus; isFriend: boolean };

const result = (status: FriendshipStatus): FriendshipResult => ({
  status,
  isFriend: status === "FRIENDS",
});

/**
 * Amistades (TKT-028, TKT-036, TKT-078). La amistad es simétrica y se guarda
 * en dos filas (docs/03-modelo-datos.md §3.3), así que para leer basta con
 * mirar en un solo sentido. Exige consentimiento (Q-04): `request` solo crea
 * una solicitud pendiente y la amistad nace en `accept`. `friendships`
 * contiene únicamente amistades aceptadas, de modo que la política de
 * visibilidad, las historias y las notificaciones no cambian.
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
   * Solicita la amistad de `friendId`. Si ya son amigos no hace nada; si
   * `friendId` ya había solicitado la de `userId`, la acepta. Repetirlo no
   * duplica solicitudes. `ValidationError` si son la misma persona;
   * `NotFoundError` si `friendId` no es un UUID o no existe.
   */
  async request(userId: string, friendId: string): Promise<FriendshipResult> {
    await assertCanChangeFriendship(userId, friendId);

    if (await this.areFriends(userId, friendId)) {
      return result("FRIENDS");
    }

    const reverse = await prisma.friendRequest.findUnique({
      where: { requesterId_addresseeId: { requesterId: friendId, addresseeId: userId } },
      select: { requesterId: true },
    });
    if (reverse) {
      await createFriendship(userId, friendId);
      return result("FRIENDS");
    }

    await prisma.friendRequest.createMany({
      data: [{ requesterId: userId, addresseeId: friendId }],
      skipDuplicates: true,
    });
    return result("PENDING");
  },

  /**
   * Acepta la solicitud que `requesterId` envió a `userId`: borra la solicitud
   * y crea las dos filas de `friendships` en una transacción. `NotFoundError`
   * si no existe esa solicitud, de modo que nadie más que la persona
   * destinataria puede aceptarla.
   */
  async accept(userId: string, requesterId: string): Promise<FriendshipResult> {
    await assertExistingRequest(requesterId, userId);
    await createFriendship(userId, requesterId);
    return result("FRIENDS");
  },

  /**
   * Rechaza la solicitud que `requesterId` envió a `userId`. Se borra sin
   * avisar a quien la envió. `NotFoundError` si no existe esa solicitud.
   */
  async reject(userId: string, requesterId: string): Promise<FriendshipResult> {
    await assertExistingRequest(requesterId, userId);
    await prisma.friendRequest.deleteMany({
      where: { requesterId, addresseeId: userId },
    });
    return result("NONE");
  },

  /**
   * Deshace la amistad en ambos sentidos y cancela la solicitud pendiente que
   * `userId` hubiera enviado a `friendId`. Repetirlo no falla. Mismos errores
   * que `request`. No toca la solicitud que `friendId` envió a `userId`: para
   * eso está `reject`.
   */
  async remove(userId: string, friendId: string): Promise<FriendshipResult> {
    await assertCanChangeFriendship(userId, friendId);

    await prisma.$transaction([
      prisma.friendship.deleteMany({
        where: {
          OR: [
            { userId, friendId },
            { userId: friendId, friendId: userId },
          ],
        },
      }),
      prisma.friendRequest.deleteMany({ where: { requesterId: userId, addresseeId: friendId } }),
    ]);
    return result("NONE");
  },

  /**
   * Hace amigos a `userId` y `friendId` sin pasar por una solicitud.
   * **Solo para semillas y pruebas**: las rutas de la API NO deben llamarla,
   * porque se saltaría el consentimiento (Q-04). Idempotente.
   */
  async add(userId: string, friendId: string): Promise<{ isFriend: true }> {
    await assertCanChangeFriendship(userId, friendId);
    await createFriendship(userId, friendId);
    return { isFriend: true };
  },
};

/** Borra cualquier solicitud entre las dos personas y crea las dos filas de amistad. */
async function createFriendship(userId: string, friendId: string): Promise<void> {
  await prisma.$transaction([
    prisma.friendRequest.deleteMany({
      where: {
        OR: [
          { requesterId: userId, addresseeId: friendId },
          { requesterId: friendId, addresseeId: userId },
        ],
      },
    }),
    prisma.friendship.createMany({
      data: [
        { userId, friendId },
        { userId: friendId, friendId: userId },
      ],
      skipDuplicates: true,
    }),
  ]);
}

async function assertExistingRequest(requesterId: string, addresseeId: string): Promise<void> {
  if (!userIdSchema.safeParse(requesterId).success) {
    throw new NotFoundError("Solicitud no encontrada");
  }
  const request = await prisma.friendRequest.findUnique({
    where: { requesterId_addresseeId: { requesterId, addresseeId } },
    select: { requesterId: true },
  });
  if (!request) {
    throw new NotFoundError("Solicitud no encontrada");
  }
}

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
