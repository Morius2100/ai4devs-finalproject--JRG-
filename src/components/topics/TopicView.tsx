"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TopicImage } from "@/components/topics/TopicImage";
import { VoteButtons, type VoteValue } from "@/components/topics/VoteButtons";
import { VoteResults } from "@/components/topics/VoteResults";
import { OpinionList } from "@/components/topics/OpinionList";
import { JustificationDialog } from "@/components/topics/JustificationDialog";
import { ApiError, castVote, fetchTopicDetail } from "@/lib/api/topics";
import type { TopicDetail } from "@/server/services/topic-service";

/**
 * Composición y flujo de voto de la pantalla de un tema (TKT-021, TKT-022):
 * imagen opcional, título y, según `myVote`, botones (que abren el diálogo
 * de justificación) o resultados + lista de opiniones. La transición a
 * resultados ocurre sin recargar la página.
 */
export function TopicView({ topic: initialTopic }: { topic: TopicDetail }) {
  const [topic, setTopic] = useState(initialTopic);
  const [pendingVote, setPendingVote] = useState<VoteValue | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (justification: string) => {
      if (!pendingVote) {
        throw new Error("No hay ningún voto pendiente");
      }
      return castVote({ topicId: topic.id, value: pendingVote, justification });
    },
    onSuccess: (result) => {
      setTopic((prev) => ({
        ...prev,
        myVote: result.myVote,
        results: { positiveVotes: result.positiveVotes, negativeVotes: result.negativeVotes },
      }));
      setPendingVote(null);
      setDialogError(null);
      // Los contadores del tema cambian: las tendencias (fase 2) quedan desactualizadas.
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      // El perfil de una persona también lista el tema con la marca de voto.
      queryClient.invalidateQueries({ queryKey: ["user-topics"] });
    },
    onError: async (error: unknown) => {
      if (error instanceof ApiError && error.status === 409) {
        const fresh = await fetchTopicDetail(topic.id);
        setTopic(fresh);
        setPendingVote(null);
        setDialogError(null);
        return;
      }
      setDialogError(
        error instanceof ApiError ? error.message : "No se ha podido registrar el voto",
      );
    },
  });

  const hasVoted = topic.myVote !== null && topic.results !== undefined;

  return (
    <div className="flex flex-1 flex-col">
      {topic.imageUrl ? <TopicImage src={topic.imageUrl} alt={topic.title} /> : null}
      <div
        className={`relative flex flex-1 flex-col bg-surface ${
          topic.imageUrl ? "-mt-4 rounded-t-3xl" : ""
        }`}
      >
        <div className="px-5 pb-2 pt-5">
          <h1 className="text-2xl font-extrabold leading-tight">{topic.title}</h1>
        </div>

        {hasVoted && topic.myVote && topic.results ? (
          <VoteResults
            positiveVotes={topic.results.positiveVotes}
            negativeVotes={topic.results.negativeVotes}
            myVote={topic.myVote}
          />
        ) : null}

        {/* Relleno siempre presente: empuja los bloques de voto al final de
            la pantalla, tenga o no contenido (opiniones) dentro. */}
        <div className="flex flex-1 flex-col">
          {hasVoted ? <OpinionList topicId={topic.id} /> : null}
        </div>
      </div>

      {hasVoted ? null : (
        <VoteButtons
          onSelect={(value) => {
            setPendingVote(value);
            setDialogError(null);
          }}
        />
      )}

      {pendingVote ? (
        <JustificationDialog
          value={pendingVote}
          isSubmitting={mutation.isPending}
          errorMessage={dialogError}
          onCancel={() => {
            setPendingVote(null);
            setDialogError(null);
          }}
          onConfirm={(justification) => mutation.mutate(justification)}
        />
      ) : null}
    </div>
  );
}
