"use client";

import { FriendToggle } from "@/components/people/FriendToggle";
import { ProfileHeader } from "@/components/people/ProfileHeader";
import { ProfileTopics } from "@/components/people/ProfileTopics";
import type { UserProfile } from "@/server/services/user-service";

/**
 * Pantalla de perfil (TKT-039, HU-14, HU-15): cabecera, check de amistad
 * (no en el propio perfil) y temas de la persona con su selector de orden.
 */
export function ProfileScreen({ profile }: { profile: UserProfile }) {
  return (
    <div className="flex flex-1 flex-col">
      <ProfileHeader profile={profile} />
      {profile.isSelf ? null : (
        <div className="px-4 pt-4">
          <FriendToggle userId={profile.id} initialIsFriend={profile.isFriend} />
        </div>
      )}
      <ProfileTopics userId={profile.id} username={profile.username} />
    </div>
  );
}
