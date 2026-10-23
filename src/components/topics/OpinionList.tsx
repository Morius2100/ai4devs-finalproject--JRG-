"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { fetchOpinionsPage } from "@/lib/api/topics";
import { OpinionItem } from "@/components/topics/OpinionItem";
import type { Opinion } from "@/server/services/vote-service";

/**
 * Lista de opiniones de un tema (TKT-022): carga continua por cursor,
 * igual patrón que `TopicList`. Solo se monta tras votar.
 */
export function OpinionList({ topicId }: { topicId: string }) {
  const { data, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey: ["opinions", topicId],
      queryFn: ({ pageParam }) => fetchOpinionsPage({ topicId, cursor: pageParam }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    });

  const items = useMemo(() => {
    const seen = new Set<string>();
    const list: Opinion[] = [];
    for (const page of data?.pages ?? []) {
      for (const item of page.items) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          list.push(item);
        }
      }
    }
    return list;
  }, [data]);

  const sentinelRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <p className="px-4 py-6 text-center text-sm font-semibold text-ink-muted">
        Cargando opiniones…
      </p>
    );
  }

  if (isError) {
    return (
      <p role="alert" className="px-4 py-6 text-center text-sm text-red-600">
        No se han podido cargar las opiniones.
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="px-4 py-6 text-center text-sm font-semibold text-ink-muted">
        Todavía no hay opiniones.
      </p>
    );
  }

  return (
    <ul className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
      {items.map((opinion) => (
        <OpinionItem key={opinion.id} opinion={opinion} />
      ))}
      {hasNextPage ? <li ref={sentinelRef} aria-hidden className="h-1" /> : null}
    </ul>
  );
}
