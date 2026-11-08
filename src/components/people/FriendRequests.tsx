"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/people/Avatar";
import { acceptFriendRequest, fetchFriendRequests, rejectFriendRequest } from "@/lib/api/users";
import { useInfiniteList } from "@/lib/use-infinite-list";
import type { PersonSummary } from "@/server/services/user-service";

/**
 * Solicitudes de amistad recibidas (TKT-080, HU-15, Q-04): sección de la
 * pantalla Personas. Cada solicitud se acepta (nace la amistad, mutua) o se
 * rechaza (se borra sin avisar a quien la envió). No se muestra nada mientras
 * carga, si falla o si no hay solicitudes.
 */
export function FriendRequests() {
  const { items, isLoading, isError, hasNextPage, sentinelRef } = useInfiniteList({
    queryKey: ["friend-requests"],
    fetchPage: (cursor) => fetchFriendRequests({ cursor }),
  });

  if (isLoading || isError || items.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="friend-requests-title" className="px-4 pt-4">
      <h2 id="friend-requests-title" className="text-lg font-extrabold">
        Solicitudes de amistad
      </h2>
      <ul aria-label="Solicitudes de amistad" className="mt-2 flex flex-col gap-3">
        {items.map((person) => (
          <FriendRequestItem key={person.id} person={person} />
        ))}
        {hasNextPage ? <li ref={sentinelRef} aria-hidden className="h-1" /> : null}
      </ul>
    </section>
  );
}

function FriendRequestItem({ person }: { person: PersonSummary }) {
  const queryClient = useQueryClient();
  const [failed, setFailed] = useState(false);

  const mutation = useMutation({
    mutationFn: (accept: boolean) =>
      accept ? acceptFriendRequest(person.id) : rejectFriendRequest(person.id),
    onMutate: () => setFailed(false),
    onError: () => setFailed(true),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      void queryClient.invalidateQueries({ queryKey: ["my-friends"] });
      void queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });

  return (
    <li className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-3">
      <div className="flex items-center gap-3">
        <Avatar username={person.username} avatarUrl={person.avatarUrl} size={44} />
        <Link
          href={`/persona?id=${person.id}`}
          className="min-w-0 flex-1 truncate text-base font-bold text-ink"
        >
          {person.username}
        </Link>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate(true)}
          aria-label={`Aceptar la solicitud de ${person.username}`}
          className="btn-primary min-h-11 flex-1 disabled:opacity-60"
        >
          Aceptar
        </button>
        <button
          type="button"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate(false)}
          aria-label={`Rechazar la solicitud de ${person.username}`}
          className="min-h-11 flex-1 rounded-full border-2 border-line text-base font-extrabold text-ink-muted hover:bg-surface-muted disabled:opacity-60"
        >
          Rechazar
        </button>
      </div>
      {failed ? (
        <p role="alert" className="text-sm font-semibold text-red-600">
          No se ha podido actualizar la solicitud
        </p>
      ) : null}
    </li>
  );
}
