"use client";

import Link from "next/link";
import { PersonListItem } from "@/components/people/PersonListItem";
import { fetchMyFriends } from "@/lib/api/me";
import { useInfiniteList } from "@/lib/use-infinite-list";

/**
 * Mis amigos (`/perfil/amigos`, TKT-063, HU-21): lista alfabética con scroll
 * infinito y la misma tarjeta que Personas. Con amistad mutua, «seguidos» y
 * «seguidores» son la misma lista, así que se muestra una sola.
 */
export function MyFriendsScreen() {
  const { items, isLoading, isError, hasNextPage, sentinelRef } = useInfiniteList({
    queryKey: ["my-friends"],
    fetchPage: (cursor) => fetchMyFriends({ cursor }),
  });

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-4 pt-4">
        <h1 className="text-2xl font-extrabold">Amigos</h1>
      </div>

      {isLoading ? (
        <p className="px-4 py-8 text-center text-sm font-semibold text-ink-muted">Cargando…</p>
      ) : isError ? (
        <p role="alert" className="px-4 py-6 text-center text-sm text-red-600">
          No se han podido cargar tus amigos.
        </p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
          <p className="text-sm font-semibold text-ink-muted">Todavía no tienes amigos.</p>
          <Link href="/personas" className="btn-primary inline-flex">
            Buscar personas
          </Link>
        </div>
      ) : (
        <ul aria-label="Amigos" className="flex flex-1 flex-col gap-3 px-4 py-4">
          {items.map((person) => (
            <PersonListItem key={person.id} person={person} />
          ))}
          {hasNextPage ? <li ref={sentinelRef} aria-hidden className="h-1" /> : null}
        </ul>
      )}
    </div>
  );
}
