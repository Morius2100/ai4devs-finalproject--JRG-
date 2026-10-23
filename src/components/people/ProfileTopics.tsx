"use client";

import { useState, type ReactNode } from "react";
import { SortSelector } from "@/components/people/SortSelector";
import { TopicListItem } from "@/components/topics/TopicListItem";
import { fetchUserTopicsPage } from "@/lib/api/users";
import { useInfiniteList } from "@/lib/use-infinite-list";
import type { TopicSort } from "@/lib/validation/users";

/**
 * Temas creados por la persona del perfil (TKT-039, HU-14 CA-14.3/14.4),
 * con el selector de orden justo encima. Al cambiar de orden la lista se
 * pide de nuevo desde el principio (otra `queryKey`).
 */
export function ProfileTopics({
  userId,
  username,
  title,
  emptyMessage,
}: {
  userId: string;
  username: string;
  /** Título de la sección; por defecto «Temas de <nombre>» (en Mi perfil, «Mis temas»). */
  title?: string;
  /** Contenido del estado vacío; por defecto el del perfil de otra persona. */
  emptyMessage?: ReactNode;
}) {
  const heading = title ?? `Temas de ${username}`;
  const [sort, setSort] = useState<TopicSort>("recent");

  const { items, isLoading, isError, hasNextPage, sentinelRef } = useInfiniteList({
    queryKey: ["user-topics", userId, sort],
    fetchPage: (cursor) => fetchUserTopicsPage({ userId, sort, cursor }),
  });

  return (
    <section aria-label={heading} className="flex flex-col gap-3 px-4 pb-4 pt-5">
      <h2 className="text-lg font-extrabold">{heading}</h2>
      <SortSelector value={sort} onChange={setSort} />

      {isLoading ? (
        <p className="py-6 text-center text-sm font-semibold text-ink-muted">Cargando…</p>
      ) : isError ? (
        <p role="alert" className="py-4 text-center text-sm text-red-600">
          No se han podido cargar los temas.
        </p>
      ) : items.length === 0 ? (
        <div className="py-6 text-center text-sm font-semibold text-ink-muted">
          {emptyMessage ?? "Esta persona todavía no tiene temas."}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((topic) => (
            <TopicListItem key={topic.id} topic={topic} />
          ))}
          {hasNextPage ? <li ref={sentinelRef} aria-hidden className="h-1" /> : null}
        </ul>
      )}
    </section>
  );
}
