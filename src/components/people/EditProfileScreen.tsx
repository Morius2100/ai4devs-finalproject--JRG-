"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Avatar } from "@/components/people/Avatar";
import { ScreenError, ScreenLoading } from "@/components/ScreenStatus";
import { ApiError, fetchMe, updateMe } from "@/lib/api/me";
import { BIO_MAX_LENGTH } from "@/lib/validation/users";
import type { OwnProfile } from "@/server/services/user-service";

/**
 * Editar perfil (`/perfil/editar`, TKT-064, HU-20): cambiar o quitar la foto
 * (con vista previa) y editar la descripción (≤ 160, con contador). «Guardar»
 * lo envía todo junto; «Cancelar» vuelve sin llamar a la API.
 */
export function EditProfileScreen() {
  const query = useQuery({ queryKey: ["me"], queryFn: fetchMe });

  if (query.isError) {
    return (
      <ScreenError message="No se ha podido cargar tu perfil." onRetry={() => query.refetch()} />
    );
  }
  if (!query.data) {
    return <ScreenLoading />;
  }
  return <EditProfileForm key={query.data.id} me={query.data} />;
}

function EditProfileForm({ me }: { me: OwnProfile }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [bio, setBio] = useState(me.bio ?? "");
  const [newAvatar, setNewAvatar] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!newAvatar) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(newAvatar);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [newAvatar]);

  const mutation = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      formData.set("bio", bio);
      if (newAvatar) {
        formData.set("avatar", newAvatar);
      } else if (removeAvatar) {
        formData.set("removeAvatar", "true");
      }
      return updateMe(formData);
    },
    onSuccess: () => {
      // La foto y la descripción se ven en mi perfil, en Personas, en el perfil
      // que ven los demás y en las historias.
      for (const key of ["me", "profile", "users", "my-friends", "stories"]) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
      router.push("/perfil");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        if (error.fieldErrors) {
          setFieldErrors(error.fieldErrors);
          return;
        }
        // 413/415 no llevan fieldErrors: tratan del campo de la foto.
        if (error.status === 413 || error.status === 415) {
          setFieldErrors({ avatar: [error.message] });
          return;
        }
        setFormError(error.message);
        return;
      }
      setFormError("No se ha podido guardar el perfil");
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);
    mutation.mutate();
  }

  const hasPhoto = Boolean(newAvatar) || (Boolean(me.avatarUrl) && !removeAvatar);
  const remaining = BIO_MAX_LENGTH - bio.length;

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 px-4 py-4" noValidate>
      <h1 className="text-2xl font-extrabold">Editar perfil</h1>

      <section aria-label="Foto de perfil" className="flex flex-col items-center gap-3">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:), no optimizable
          <img
            src={previewUrl}
            alt="Vista previa de la nueva foto"
            className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-md"
          />
        ) : (
          <Avatar
            username={me.username}
            avatarUrl={removeAvatar ? null : me.avatarUrl}
            size={96}
            className="border-4 border-white shadow-md"
          />
        )}

        <div className="flex flex-wrap items-center justify-center gap-2">
          <label className="btn-secondary relative cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-brand-green">
            Cambiar foto
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Cambiar foto"
              className="absolute inset-0 cursor-pointer opacity-0"
              disabled={mutation.isPending}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setNewAvatar(file);
                if (file) setRemoveAvatar(false);
                setFieldErrors((errors) => ({ ...errors, avatar: [] }));
                event.target.value = "";
              }}
            />
          </label>
          {hasPhoto ? (
            <button
              type="button"
              className="btn-secondary"
              disabled={mutation.isPending}
              onClick={() => {
                if (newAvatar) {
                  setNewAvatar(null);
                } else {
                  setRemoveAvatar(true);
                }
              }}
            >
              Quitar foto
            </button>
          ) : null}
        </div>

        {fieldErrors.avatar?.[0] ? (
          <p role="alert" className="text-sm text-red-600">
            {fieldErrors.avatar[0]}
          </p>
        ) : null}
      </section>

      <div>
        <label htmlFor="bio" className="block text-sm font-bold">
          Descripción
        </label>
        <textarea
          id="bio"
          value={bio}
          maxLength={BIO_MAX_LENGTH}
          rows={3}
          onChange={(event) => setBio(event.target.value)}
          disabled={mutation.isPending}
          aria-describedby="bio-count"
          className="field mt-1 h-auto min-h-24 rounded-3xl py-3"
        />
        <p id="bio-count" className="mt-1 text-right text-xs font-semibold text-ink-muted">
          {remaining === 1 ? "1 carácter restante" : `${remaining} caracteres restantes`}
        </p>
        {fieldErrors.bio?.[0] ? (
          <p role="alert" className="mt-1 text-sm text-red-600">
            {fieldErrors.bio[0]}
          </p>
        ) : null}
      </div>

      {formError ? (
        <p role="alert" className="text-sm text-red-600">
          {formError}
        </p>
      ) : null}

      <div className="mt-2 flex flex-col gap-2">
        <button type="submit" disabled={mutation.isPending} className="btn-primary w-full">
          {mutation.isPending ? "Guardando…" : "Guardar"}
        </button>
        <Link href="/perfil" className="btn-secondary w-full text-center">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
