"use client";

import { fetchPeoplePage } from "@/lib/api/users";
import { useInfiniteList } from "@/lib/use-infinite-list";
import { PersonListItem } from "@/components/people/PersonListItem";

type PeopleListProps = {
  /** Texto de búsqueda actual; `undefined` = todas las personas. */
  q?: string;
  /** Mensaje de estado vacío: distinto con y sin búsqueda. */
  emptyMessage: string;
};

/**
 * Lista scrolleable de personas con carga continua por cursor (TKT-038),
 * con el mismo patrón que `TopicList`.
 */
export function PeopleList({ q, emptyMessage }: PeopleListProps) {
  const { items, isLoading, isError, hasNextPage, sentinelRef } = useInfiniteList({
    queryKey: ["users", q ?? null],
    fetchPage: (cursor) => fetchPeoplePage({ q, cursor }),
  });

  if (isLoading) {
    return <p className="px-4 py-8 text-center text-sm font-semibold text-ink-muted">Cargando…</p>;
  }

  if (isError) {
    return (
      <p role="alert" className="px-4 py-6 text-center text-sm text-red-600">
        No se han podido cargar las personas.
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm font-semibold text-ink-muted">{emptyMessage}</p>
    );
  }

  return (
    <ul className="flex flex-1 flex-col gap-3 px-4 py-4">
      {items.map((person) => (
        <PersonListItem key={person.id} person={person} />
      ))}
      {hasNextPage ? <li ref={sentinelRef} aria-hidden className="h-1" /> : null}
    </ul>
  );
}
