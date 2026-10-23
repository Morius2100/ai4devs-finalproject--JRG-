"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ProfileHeader } from "@/components/people/ProfileHeader";
import { ProfileTopics } from "@/components/people/ProfileTopics";
import { ScreenError, ScreenLoading } from "@/components/ScreenStatus";
import { fetchMe } from "@/lib/api/me";

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/**
 * Mi perfil (`/perfil`, TKT-062, HU-21): cabecera con foto, nombre,
 * descripción, contadores (el de amigos abre mi lista) y «Editar perfil»;
 * debajo, «Mis temas» con todos mis temas, también los privados.
 */
export function MyProfileScreen() {
  const query = useQuery({ queryKey: ["me"], queryFn: fetchMe });

  if (query.isError) {
    return (
      <ScreenError message="No se ha podido cargar tu perfil." onRetry={() => query.refetch()} />
    );
  }
  if (!query.data) {
    return <ScreenLoading />;
  }

  const me = query.data;
  return (
    <div className="flex flex-1 flex-col">
      <ProfileHeader
        profile={me}
        stats={
          <>
            <span>{plural(me.topicsCount, "tema", "temas")}</span>
            <Link
              href="/perfil/amigos"
              className="flex min-h-11 items-center underline decoration-2 underline-offset-4"
            >
              {plural(me.friendsCount, "amigo", "amigos")}
            </Link>
          </>
        }
        action={
          <Link
            href="/perfil/editar"
            className="inline-flex min-h-11 items-center rounded-full bg-white px-6 text-sm font-extrabold text-on-yellow shadow-sm"
          >
            Editar perfil
          </Link>
        }
      />
      <ProfileTopics
        userId={me.id}
        username={me.username}
        title="Mis temas"
        emptyMessage={
          <>
            <p>Todavía no has creado temas.</p>
            <Link href="/temas/nuevo" className="btn-primary mt-3 inline-flex">
              Crear un tema
            </Link>
          </>
        }
      />
    </div>
  );
}
