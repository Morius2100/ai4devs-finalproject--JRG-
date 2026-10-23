"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { setFriendship } from "@/lib/api/users";

/**
 * Check de amistad del perfil (TKT-039, HU-15): píldora a todo el ancho que
 * añade o quita a la persona de amigos. Actualiza el estado al instante
 * (optimista), bloquea el botón mientras se envía y, si falla, lo revierte y
 * avisa con un `role="alert"`. Al terminar invalida la lista de personas y
 * los temas del perfil, que dependen de la amistad.
 */
export function FriendToggle({
  userId,
  initialIsFriend,
}: {
  userId: string;
  initialIsFriend: boolean;
}) {
  const queryClient = useQueryClient();
  const [isFriend, setIsFriend] = useState(initialIsFriend);
  const [failed, setFailed] = useState(false);

  // Si el servidor trae otro valor (p. ej. tras volver atrás), lo adopta.
  useEffect(() => {
    setIsFriend(initialIsFriend);
  }, [initialIsFriend]);

  const mutation = useMutation({
    mutationFn: (friend: boolean) => setFriendship({ userId, friend }),
    onMutate: (friend) => {
      setFailed(false);
      setIsFriend(friend);
    },
    onError: (_error, friend) => {
      setIsFriend(!friend);
      setFailed(true);
    },
    onSuccess: (result) => {
      setIsFriend(result.isFriend);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      void queryClient.invalidateQueries({ queryKey: ["user-topics", userId] });
      // Mi perfil: el contador y la lista de amigos dependen de la amistad.
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      void queryClient.invalidateQueries({ queryKey: ["my-friends"] });
      // Las historias de amigos también dependen de ella.
      void queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        aria-pressed={isFriend}
        disabled={mutation.isPending}
        onClick={() => mutation.mutate(!isFriend)}
        className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-[#017963] text-base font-extrabold transition-colors disabled:opacity-60 ${
          isFriend
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
        {isFriend ? "Amigos" : "Añadir a amigos"}
      </button>
      {failed ? (
        <p role="alert" className="text-center text-sm font-semibold text-red-600">
          No se ha podido actualizar la amistad
        </p>
      ) : null}
    </div>
  );
}
