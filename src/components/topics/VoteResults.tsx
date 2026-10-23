import type { VoteValue } from "@prisma/client";
import { ThumbIcon } from "@/components/topics/ThumbIcon";

function votesLabel(count: number) {
  return count === 1 ? "1 voto" : `${count} votos`;
}

function ResultBlock({
  direction,
  percent,
  count,
  isMine,
}: {
  direction: "up" | "down";
  percent: number;
  count: number;
  isMine: boolean;
}) {
  const colors =
    direction === "up"
      ? isMine
        ? "bg-green-700 text-white"
        : "bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-300"
      : isMine
        ? "bg-red-600 text-white"
        : "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300";

  return (
    <div
      className={`flex h-24 flex-col items-center justify-center rounded-3xl border-2 ${
        direction === "up" ? "border-green-600" : "border-red-600"
      } ${colors}`}
    >
      <p className="flex items-center gap-1.5 text-3xl font-extrabold leading-none">
        <ThumbIcon direction={direction} className="h-6 w-6" />
        {percent} %
      </p>
      <p className="mt-1 text-sm font-semibold">
        {votesLabel(count)}
        {isMine ? " · Tu voto" : ""}
      </p>
    </div>
  );
}

/**
 * Resultados de la votación (TKT-022): sustituyen a los bloques de voto
 * cuando el usuario ya ha votado; porcentaje y total por lado, voto propio
 * destacado.
 */
export function VoteResults({
  positiveVotes,
  negativeVotes,
  myVote,
}: {
  positiveVotes: number;
  negativeVotes: number;
  myVote: VoteValue;
}) {
  const total = positiveVotes + negativeVotes;
  const positivePercent = total === 0 ? 0 : Math.round((positiveVotes / total) * 100);
  const negativePercent = total === 0 ? 0 : 100 - positivePercent;

  return (
    <section aria-labelledby="vote-results-title" className="px-4 pb-2">
      <h2 id="vote-results-title" className="sr-only">
        Resultados
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <ResultBlock
          direction="up"
          percent={positivePercent}
          count={positiveVotes}
          isMine={myVote === "UP"}
        />
        <ResultBlock
          direction="down"
          percent={negativePercent}
          count={negativeVotes}
          isMine={myVote === "DOWN"}
        />
      </div>
    </section>
  );
}
