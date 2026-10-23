import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/server/db/client";
import { decodeCursor, encodeCursor } from "@/server/cursor";
import { NotFoundError, ValidationError } from "@/server/errors";
import { isAvatarKey, toMediaUrl } from "@/server/media";
import { imageStorage, type UploadedImage } from "@/server/storage";
import { escapeLikePattern } from "@/server/sql";
import { userIdSchema } from "@/lib/validation/users";

const PAGE_SIZE = 20;

export type PersonSummary = {
  id: string;
  username: string;
  avatarUrl: string | null;
  isFriend: boolean;
};

export type PeoplePage = {
  items: PersonSummary[];
  nextCursor: string | null;
};

export type UserProfile = {
  id: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  isFriend: boolean;
  isSelf: boolean;
};

export type OwnProfile = {
  id: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  topicsCount: number;
  friendsCount: number;
};

// Claves de orden del cursor, como el ORDER BY: [lower(username), id].
const peopleCursorSchema = z.tuple([z.string(), z.string().uuid()]);

type PersonRow = {
  id: string;
  username: string;
  avatar_url: string | null;
  is_friend: boolean;
  sort_name: string;
};

async function queryPeoplePage({
  viewerId,
  onlyFriends,
  nameFilter,
  cursor,
}: {
  viewerId: string;
  onlyFriends: boolean;
  nameFilter: Prisma.Sql;
  cursor?: string;
}): Promise<PeoplePage> {
  const seek = cursor
    ? (() => {
        const [sortName, id] = decodeCursor(cursor, peopleCursorSchema);
        return Prisma.sql`AND (lower(u.username), u.id) > (${sortName}, ${id}::uuid)`;
      })()
    : Prisma.empty;
  const friendJoin = onlyFriends ? Prisma.sql`JOIN` : Prisma.sql`LEFT JOIN`;

  const rows = await prisma.$queryRaw<PersonRow[]>`
    SELECT u.id, u.username, u.avatar_url,
           (f.user_id IS NOT NULL) AS is_friend,
           lower(u.username) AS sort_name
    FROM users u
    ${friendJoin} friendships f
      ON f.user_id = ${viewerId}::uuid AND f.friend_id = u.id
    WHERE u.id <> ${viewerId}::uuid
      ${nameFilter}
      ${seek}
    ORDER BY lower(u.username), u.id
    LIMIT ${PAGE_SIZE + 1}
  `;

  const hasMore = rows.length > PAGE_SIZE;
  const page = rows.slice(0, PAGE_SIZE);
  const last = page[page.length - 1];
  const nextCursor = hasMore && last ? encodeCursor([last.sort_name, last.id]) : null;

  return {
    items: page.map((row) => ({
      id: row.id,
      username: row.username,
      avatarUrl: toMediaUrl(row.avatar_url),
      isFriend: row.is_friend,
    })),
    nextCursor,
  };
}

/**
 * Personas y perfiles (TKT-034, TKT-035). Nunca selecciona ni devuelve el
 * email ni la contraseña de otros usuarios.
 */
export const UserService = {
  /**
   * Lista alfabética (sin distinguir mayúsculas) de todos los usuarios salvo
   * `viewerId`, con `isFriend` según la relación con quien mira. Con `q`,
   * filtra por coincidencia parcial del nombre de usuario. Keyset de 20.
   */
  async search({
    viewerId,
    q,
    cursor,
  }: {
    viewerId: string;
    q?: string;
    cursor?: string;
  }): Promise<PeoplePage> {
    const nameFilter = q
      ? Prisma.sql`AND lower(u.username) LIKE lower(${`%${escapeLikePattern(q)}%`}) ESCAPE '\\'`
      : Prisma.empty;

    return queryPeoplePage({ viewerId, onlyFriends: false, nameFilter, cursor });
  },

  /**
   * Amigos de `userId` (TKT-060): misma lista alfabética, tarjeta y cursor que
   * `search`, pero solo con quien tiene amistad (`isFriend` siempre `true`).
   */
  async listFriends({ userId, cursor }: { userId: string; cursor?: string }): Promise<PeoplePage> {
    return queryPeoplePage({
      viewerId: userId,
      onlyFriends: true,
      nameFilter: Prisma.empty,
      cursor,
    });
  },

  /**
   * Perfil del propio usuario (TKT-060) con sus contadores: todos sus temas,
   * también los privados, y sus amigos. Nunca incluye el email.
   */
  async getOwnProfile(userId: string): Promise<OwnProfile> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, avatarUrl: true, bio: true },
    });
    if (!user) {
      throw new NotFoundError("Persona no encontrada");
    }

    const [topicsCount, friendsCount] = await Promise.all([
      prisma.topic.count({ where: { authorId: userId } }),
      prisma.friendship.count({ where: { userId } }),
    ]);

    return { ...user, avatarUrl: toMediaUrl(user.avatarUrl), topicsCount, friendsCount };
  },

  /**
   * Edita la foto y la descripción propias (TKT-061), todo o nada: una imagen
   * no válida (`413`/`415`) o datos inválidos no cambian nada. Orden: subir la
   * foto → actualizar → (si falla) borrar la foto nueva → borrar la anterior.
   * `bio`: `undefined` = sin cambios, `null` = quitar. Solo se borran fotos
   * propias del almacenamiento (`avatars/`), nunca URLs ajenas como las del seed.
   */
  async updateProfile(
    userId: string,
    {
      bio,
      avatar,
      removeAvatar,
    }: { bio?: string | null; avatar?: File | null; removeAvatar?: boolean },
  ): Promise<OwnProfile> {
    if (avatar && removeAvatar) {
      throw new ValidationError("No puedes cambiar y quitar la foto a la vez", {
        removeAvatar: ["No puedes cambiar y quitar la foto a la vez"],
      });
    }

    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });
    if (!current) {
      throw new NotFoundError("Persona no encontrada");
    }

    let uploaded: UploadedImage | null = null;
    if (avatar) {
      uploaded = await imageStorage.upload(avatar, { prefix: "avatars" });
    }

    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(bio !== undefined ? { bio } : {}),
          ...(uploaded ? { avatarUrl: uploaded.key } : removeAvatar ? { avatarUrl: null } : {}),
        },
      });
    } catch (error) {
      if (uploaded) {
        await imageStorage.remove(uploaded.key).catch(() => {});
      }
      throw error;
    }

    if ((uploaded || removeAvatar) && isAvatarKey(current.avatarUrl)) {
      await imageStorage.remove(current.avatarUrl).catch(() => {});
    }

    return this.getOwnProfile(userId);
  },

  /**
   * Perfil de una persona (TKT-035). `NotFoundError` si el id no es un UUID
   * o no existe ningún usuario con él.
   */
  async getProfile(id: string, viewerId: string): Promise<UserProfile> {
    if (!userIdSchema.safeParse(id).success) {
      throw new NotFoundError("Persona no encontrada");
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, avatarUrl: true, bio: true },
    });
    if (!user) {
      throw new NotFoundError("Persona no encontrada");
    }

    const isSelf = user.id === viewerId;
    const friendship = isSelf
      ? null
      : await prisma.friendship.findUnique({
          where: { userId_friendId: { userId: viewerId, friendId: user.id } },
          select: { userId: true },
        });

    return {
      ...user,
      avatarUrl: toMediaUrl(user.avatarUrl),
      isFriend: friendship !== null,
      isSelf,
    };
  },
};
