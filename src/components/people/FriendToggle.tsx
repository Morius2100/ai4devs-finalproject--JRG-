"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { setFriendship } from "@/lib/api/users";

type ToggleState = "NONE" | "SENT" | "RECEIVED" | "FRIENDS";

function initialState(isFriend: boolean, friendRequest: "SENT" | "RECEIVED" | null): ToggleState {
  if (isFriend) return "FRIENDS";
  return friendRequest ?? "NONE";
}

const LABELS: Record<ToggleState, string> = {
  NONE: "Añadir a amigos",
  SENT: "Solicitud enviada",
  RECEIVED: "Aceptar solicitud",
  FRIENDS: "Amigos",
};

/**
 * Check de amistad del perfil (TKT-080, HU-15, Q-04): píldora a todo el ancho.
 * Sin amistad envía una solicitud («Solicitud enviada»; la amistad solo existe
 * cuando la otra persona acepta); con una solicitud enviada la cancela; con una
 * recibida la acepta; siendo amigos, quita la amistad. Actualiza el estado al
 * instante (optimista), bloquea el botón mientras se envía y, si falla, lo
 * revierte y avisa con un `role="alert"`. Al terminar invalida lo que depende
 * de la amistad.
 */
export function FriendToggle({
  userId,
  initialIsFriend,
  initialFriendRequest = null,
}: {
  userId: string;
  initialIsFriend: boolean;
  initialFriendRequest?: "SENT" | "RECEIVED" | null;
}) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<ToggleState>(
    initialState(initialIsFriend, initialFriendRequest),
  );
  const [failed, setFailed] = useState(false);

  // Si el servidor trae otro valor (p. ej. tras volver atrás), lo adopta.
  useEffect(() => {
    setState(initialState(initialIsFriend, initialFriendRequest));
  }, [initialIsFriend, initialFriendRequest]);

  const mutation = useMutation({
    // Con amistad o solicitud enviada se pide quitar o cancelar (DELETE); si no, solicitar o aceptar (PUT).
    mutationFn: (current: ToggleState) =>
      setFriendship({ userId, friend: current === "NONE" || current === "RECEIVED" }),
    onMutate: (current) => {
      setFailed(false);
      setState(current === "NONE" ? "SENT" : current === "RECEIVED" ? "FRIENDS" : "NONE");
    },
    onError: (_error, current) => {
      setState(current);
      setFailed(true);
    },
    onSuccess: (result) => {
      setState(
        result.status === "FRIENDS" ? "FRIENDS" : result.status === "PENDING" ? "SENT" : "NONE",
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      void queryClient.invalidateQueries({ queryKey: ["user-topics", userId] });
      // Mi perfil: el contador y la lista de amigos dependen de la amistad.
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      void queryClient.invalidateQueries({ queryKey: ["my-friends"] });
      void queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      // Las historias de amigos también dependen de ella.
      void queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });

  const filled = state === "FRIENDS" || state === "SENT";

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        aria-pressed={filled}
        disabled={mutation.isPending}
        onClick={() => mutation.mutate(state)}
        className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-[#017963] text-base font-extrabold transition-colors disabled:opacity-60 ${
          filled
            ? "bg-[#017963] text-white hover:bg-[#035949]"
            : "bg-transparent text-brand-green-strong hover:bg-brand-green-soft"
        }`}
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m5 12.5 4.5 4.5L19 7" />
        </svg>
        {LABELS[state]}
      </button>
      {failed ? (
        <p role="alert" className="text-center text-sm font-semibold text-red-600">
          No se ha podido actualizar la amistad
        </p>
      ) : null}
    </div>
  );
}
