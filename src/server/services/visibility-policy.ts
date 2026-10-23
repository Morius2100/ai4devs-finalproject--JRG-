import type { Visibility } from "@prisma/client";
import { FriendshipService } from "@/server/services/friendship-service";

export type VisibilityCheckTopic = {
  visibility: Visibility;
  authorId: string;
};

/**
 * Único punto de decisión de acceso a un tema (TKT-016/TKT-028,
 * docs/02-arquitectura.md §2.3): público → siempre accesible; privado →
 * solo el creador o sus amigos.
 */
export const VisibilityPolicy = {
  /**
   * Núcleo puro y síncrono: `areFriends` ya calculado. Útil para tests y
   * para `canAccessAsync`, que es lo que deben usar los servicios.
   */
  canAccess(
    topic: VisibilityCheckTopic,
    viewerId: string,
    { areFriends }: { areFriends: boolean },
  ): boolean {
    if (topic.visibility === "PUBLIC") {
      return true;
    }
    return topic.authorId === viewerId || areFriends;
  },

  /**
   * Versión real, usada por los servicios (TopicService, VoteService):
   * solo consulta `FriendshipService` cuando hace falta (tema privado de
   * otro autor), para no gastar una consulta en cada tema público.
   */
  async canAccessAsync(topic: VisibilityCheckTopic, viewerId: string): Promise<boolean> {
    if (topic.visibility === "PUBLIC" || topic.authorId === viewerId) {
      return true;
    }
    const areFriends = await FriendshipService.areFriends(topic.authorId, viewerId);
    return this.canAccess(topic, viewerId, { areFriends });
  },

  /**
   * ¿Puede `viewerId` ver los temas privados de `authorId`? Misma regla que
   * `canAccessAsync` para un tema privado: solo el autor o sus amigos. La
   * usan los listados por autor (perfil, TKT-035) para no evaluar la
   * política tema a tema.
   */
  async canSeePrivateTopicsOf(authorId: string, viewerId: string): Promise<boolean> {
    return this.canAccessAsync({ visibility: "PRIVATE", authorId }, viewerId);
  },
};
