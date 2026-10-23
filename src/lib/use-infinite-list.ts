"use client";

import { useInfiniteQuery, type QueryKey } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, type RefObject } from "react";

type Page<T> = { items: T[]; nextCursor: string | null };

type UseInfiniteListOptions<T> = {
  queryKey: QueryKey;
  /** Pide una página; `cursor` es `undefined` para la primera. */
  fetchPage: (cursor: string | undefined) => Promise<Page<T>>;
};

type UseInfiniteListResult<T> = {
  items: T[];
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  /** Elemento centinela: al acercarse a la vista se carga la página siguiente. */
  sentinelRef: RefObject<HTMLLIElement | null>;
};

/**
 * Lista con carga continua por cursor (TKT-013, TKT-038): `useInfiniteQuery`
 * + `IntersectionObserver` sobre un centinela, deduplicando por `id`
 * (el orden por contadores mutables puede repetir/omitir un elemento entre
 * páginas). La comparten las listas de temas y de personas.
 */
export function useInfiniteList<T extends { id: string }>({
  queryKey,
  fetchPage,
}: UseInfiniteListOptions<T>): UseInfiniteListResult<T> {
  const { data, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey,
      queryFn: ({ pageParam }) => fetchPage(pageParam),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    });

  const items = useMemo(() => {
    const seen = new Set<string>();
    const list: T[] = [];
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

  return { items, isLoading, isError, hasNextPage: Boolean(hasNextPage), sentinelRef };
}
