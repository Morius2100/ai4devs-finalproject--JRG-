"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ScreenError, ScreenLoading } from "@/components/ScreenStatus";
import { TopicNotFound } from "@/components/topics/TopicNotFound";
import { TopicView } from "@/components/topics/TopicView";
import { ApiError, fetchTopicDetail } from "@/lib/api/topics";

/**
 * Pantalla de un tema (`/tema?id=`, TKT-045): carga el detalle desde la API
 * y muestra el tema o «tema no encontrado» (inexistente, privado ajeno o sin `id`).
 */
export function TopicScreen() {
  const id = useSearchParams().get("id") ?? "";
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["topic", id],
    queryFn: () => fetchTopicDetail(id),
    enabled: id !== "",
    retry: (count, error) => !(error instanceof ApiError) && count < 2,
  });

  // Cargar el tema lo marca como visto en el servidor: las historias de amigos
  // dejan de contarlo y se vuelven a pedir al volver a la pantalla de temas (HU-19).
  const loadedId = query.data?.id;
  useEffect(() => {
    if (loadedId) {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    }
  }, [loadedId, queryClient]);

  if (id === "" || (query.error instanceof ApiError && query.error.status === 404)) {
    return <TopicNotFound />;
  }
  if (query.isError) {
    return (
      <ScreenError message="No se ha podido cargar el tema." onRetry={() => query.refetch()} />
    );
  }
  if (!query.data) {
    return <ScreenLoading />;
  }
  return <TopicView key={query.data.id} topic={query.data} />;
}
