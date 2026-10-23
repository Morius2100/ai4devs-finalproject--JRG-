"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { PersonNotFound } from "@/components/people/PersonNotFound";
import { ProfileScreen } from "@/components/people/ProfileScreen";
import { ScreenError, ScreenLoading } from "@/components/ScreenStatus";
import { ApiError, fetchUserProfile } from "@/lib/api/users";

/**
 * Pantalla de perfil (`/persona?id=`, TKT-045): carga el perfil desde la API
 * y muestra el perfil o «Persona no encontrada» (inexistente, id inválido o sin `id`).
 */
export function PersonScreen() {
  const id = useSearchParams().get("id") ?? "";
  const query = useQuery({
    queryKey: ["profile", id],
    queryFn: () => fetchUserProfile(id),
    enabled: id !== "",
    retry: (count, error) => !(error instanceof ApiError) && count < 2,
  });

  if (id === "" || (query.error instanceof ApiError && query.error.status === 404)) {
    return <PersonNotFound />;
  }
  if (query.isError) {
    return (
      <ScreenError message="No se ha podido cargar el perfil." onRetry={() => query.refetch()} />
    );
  }
  if (!query.data) {
    return <ScreenLoading />;
  }
  return <ProfileScreen key={query.data.id} profile={query.data} />;
}
