"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { fetchNotificationsPage } from "@/lib/api/notifications";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import type { NotificationItem as NotificationItemType } from "@/server/services/notification-service";

/**
 * Lista de notificaciones con carga continua (TKT-031), mismo patrón que
 * `TopicList`/`OpinionList`.
 */
export function NotificationList() {
  const { data, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey: ["notifications"],
      queryFn: ({ pageParam }) => fetchNotificationsPage({ cursor: pageParam }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    });

  const items = useMemo(() => {
    const seen = new Set<string>();
    const list: NotificationItemType[] = [];
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
    return <p className="px-4 py-8 text-center text-sm font-semibold text-ink-muted">Cargando…</p>;
  }

  if (isError) {
    return (
      <p role="alert" className="px-4 py-8 text-center text-sm font-semibold text-red-600">
        No se han podido cargar las notificaciones.
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm font-semibold text-ink-muted">
        Todavía no tienes notificaciones.
      </p>
    );
  }

  return (
    <ul className="flex flex-1 flex-col gap-3 px-4 pb-4">
      {items.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
      {hasNextPage ? <li ref={sentinelRef} aria-hidden className="h-1" /> : null}
    </ul>
  );
}
