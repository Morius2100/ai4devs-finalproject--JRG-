"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createTopicSchema } from "@/lib/validation/topic";
import { ApiError, createTopic } from "@/lib/api/topics";

const segmentClass =
  "relative flex min-h-11 cursor-pointer items-center justify-center rounded-full text-sm font-bold text-ink-muted has-[:checked]:bg-[#017963] has-[:checked]:text-white has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-brand-green";

/**
 * Formulario de creación de tema (TKT-026): título, visibilidad (pública
 * por defecto) e imagen opcional. Tras crear, redirige a `/tema?id=` sin
 * mostrar de nuevo el formulario (design.md de fase-5-creacion-temas).
 */
export default function CreateTopicPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [image, setImage] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      const formData = new FormData();
      formData.set("title", title);
      formData.set("visibility", visibility);
      if (image) {
        formData.set("image", image);
      }
      return createTopic(formData);
    },
    onSuccess: (topic) => {
      // Los contadores/listado de tendencias (fase 2) quedan desactualizados.
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      router.push(`/tema?id=${topic.id}`);
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        if (error.fieldErrors) {
          setFieldErrors(error.fieldErrors);
          return;
        }
        // 413/415 no llevan fieldErrors (no son ValidationError): tratan del campo imagen.
        if (error.status === 413 || error.status === 415) {
          setFieldErrors({ image: [error.message] });
          return;
        }
        setFormError(error.message);
        return;
      }
      setFormError("No se ha podido crear el tema");
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const parsed = createTopicSchema.safeParse({ title, visibility });
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors as Record<string, string[]>);
      return;
    }

    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 px-4 py-4" noValidate>
      <h1 className="text-2xl font-extrabold">Crear tema</h1>

      <div>
        <label htmlFor="title" className="block text-sm font-bold">
          Título
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={mutation.isPending}
          className="field mt-1"
        />
        {fieldErrors.title ? (
          <p role="alert" className="mt-1 text-sm text-red-600">
            {fieldErrors.title[0]}
          </p>
        ) : null}
      </div>

      <fieldset>
        <legend className="block text-sm font-bold">Visibilidad</legend>
        <div className="mt-1 grid grid-cols-2 gap-1 rounded-full bg-surface-muted p-1">
          <label className={segmentClass}>
            <input
              type="radio"
              className="absolute inset-0 cursor-pointer opacity-0"
              name="visibility"
              value="PUBLIC"
              checked={visibility === "PUBLIC"}
              onChange={() => setVisibility("PUBLIC")}
              disabled={mutation.isPending}
            />
            Público
          </label>
          <label className={segmentClass}>
            <input
              type="radio"
              className="absolute inset-0 cursor-pointer opacity-0"
              name="visibility"
              value="PRIVATE"
              checked={visibility === "PRIVATE"}
              onChange={() => setVisibility("PRIVATE")}
              disabled={mutation.isPending}
            />
            Privado
          </label>
        </div>
      </fieldset>

      <div>
        <label htmlFor="image" className="block text-sm font-bold">
          Imagen (opcional)
        </label>
        <input
          id="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => setImage(event.target.files?.[0] ?? null)}
          disabled={mutation.isPending}
          className="mt-1 w-full rounded-2xl border-2 border-dashed border-line bg-surface-muted p-3 text-sm text-ink file:mr-3 file:rounded-full file:border-0 file:bg-brand-green-soft file:px-4 file:py-2 file:font-bold file:text-brand-green-strong"
        />
        {fieldErrors.image ? (
          <p role="alert" className="mt-1 text-sm text-red-600">
            {fieldErrors.image[0]}
          </p>
        ) : null}
      </div>

      {formError ? (
        <p role="alert" className="text-sm text-red-600">
          {formError}
        </p>
      ) : null}

      <button type="submit" disabled={mutation.isPending} className="btn-primary mt-2 w-full">
        {mutation.isPending ? "Creando…" : "Crear tema"}
      </button>
    </form>
  );
}
