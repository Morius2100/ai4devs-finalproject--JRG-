"use client";

import { fetchTopicsPage } from "@/lib/api/topics";
import { useInfiniteList } from "@/lib/use-infinite-list";
import { TopicListItem } from "@/components/topics/TopicListItem";

type TopicListProps = {
  /** Texto de búsqueda actual; `undefined` = tendencias. */
  q?: string;
  /** Mensaje de estado vacío: distinto para tendencias y para búsqueda. */
  emptyMessage: string;
};

/**
 * Lista scrolleable de temas con carga continua por cursor (TKT-013).
 * La paginación y la deduplicación por `id` viven en `useInfiniteList`
 * (design.md: el orden por contador mutable puede repetir/omitir un tema
 * entre páginas).
 */
export function TopicList({ q, emptyMessage }: TopicListProps) {
  const { items, isLoading, isError, hasNextPage, sentinelRef } = useInfiniteList({
    queryKey: ["topics", q ?? null],
    fetchPage: (cursor) => fetchTopicsPage({ q, cursor }),
  });

  if (isLoading) {
    return <p className="px-4 py-8 text-center text-sm font-semibold text-ink-muted">Cargando…</p>;
  }

  if (isError) {
    return (
      <p role="alert" className="px-4 py-6 text-center text-sm text-red-600">
        No se han podido cargar los temas.
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm font-semibold text-ink-muted">{emptyMessage}</p>
    );
  }

  return (
    <ul aria-label="Temas" className="flex flex-1 flex-col gap-3 px-4 py-4">
      {items.map((topic) => (
        <TopicListItem key={topic.id} topic={topic} />
      ))}
      {hasNextPage ? <li ref={sentinelRef} aria-hidden className="h-1" /> : null}
    </ul>
  );
}
