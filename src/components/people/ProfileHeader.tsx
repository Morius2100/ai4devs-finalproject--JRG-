import type { ReactNode } from "react";
import { Avatar } from "@/components/people/Avatar";
import type { UserProfile } from "@/server/services/user-service";

/**
 * Cabecera del perfil (TKT-039, HU-14 CA-14.2): continúa el amarillo de
 * marca bajo la cabecera de la app con la foto (o inicial), el nombre y la
 * descripción breve, que se omite si no existe.
 */
export function ProfileHeader({
  profile,
  stats,
  action,
}: {
  profile: Pick<UserProfile, "username" | "avatarUrl" | "bio">;
  /** Contadores bajo la descripción (solo en Mi perfil, TKT-062). */
  stats?: ReactNode;
  /** Acción bajo los contadores, p. ej. «Editar perfil» (solo en Mi perfil). */
  action?: ReactNode;
}) {
  return (
    <section
      aria-label="Perfil"
      className="flex flex-col items-center gap-1 rounded-b-[28px] bg-brand-yellow px-5 pb-6 pt-2 text-center text-on-yellow shadow-sm"
    >
      <Avatar
        username={profile.username}
        avatarUrl={profile.avatarUrl}
        size={88}
        className="border-4 border-white shadow-md"
      />
      <h1 className="mt-2 text-2xl font-extrabold">{profile.username}</h1>
      {profile.bio ? <p className="max-w-xs text-sm font-semibold">{profile.bio}</p> : null}
      {stats ? <div className="mt-2 flex items-center gap-5 text-sm font-bold">{stats}</div> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </section>
  );
}
