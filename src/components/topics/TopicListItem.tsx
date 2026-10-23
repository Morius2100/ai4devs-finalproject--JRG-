import Image from "next/image";
import Link from "next/link";
import { ThumbIcon } from "@/components/topics/ThumbIcon";
import { resolveMediaUrl } from "@/lib/platform/media";
import { formatRelativeDate } from "@/lib/format/relative-date";
import type { TopicSummary } from "@/server/services/topic-service";

const chipClass = "rounded-full px-2.5 py-0.5 text-xs font-semibold";

// Fondo suave según el voto propio, en claro y oscuro (tonos de `VoteResults`).
const cardClass = {
  none: "border-line bg-surface hover:bg-surface-muted",
  UP: "border-green-200 bg-green-50 hover:bg-green-100 dark:border-green-900 dark:bg-green-950/40 dark:hover:bg-green-950/60",
  DOWN: "border-red-200 bg-red-50 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:hover:bg-red-950/60",
} as const;

const chipTone = {
  none: "bg-surface-muted text-ink-muted",
  UP: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  DOWN: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
} as const;

/**
 * Tarjeta de tema en la lista (TKT-013, TKT-052): miniatura o inicial, título,
 * total de votos, fecha de creación y enlace a `/tema?id=`; área táctil ≥ 44 px.
 * Si el usuario ya votó, fondo verde o rojo suave, desglose a favor / en
 * contra y etiqueta accesible con su voto.
 */
export function TopicListItem({ topic }: { topic: TopicSummary }) {
  const initial = topic.title.trim().charAt(0).toUpperCase();
  const tone = topic.myVote ?? "none";

  return (
    <li>
      <Link
        href={`/tema?id=${topic.id}`}
        className={`flex min-h-16 items-center gap-3 rounded-2xl border p-3 ${cardClass[tone]}`}
      >
        {topic.imageUrl ? (
          <Image
            src={resolveMediaUrl(topic.imageUrl)}
            alt=""
            width={64}
            height={64}
            sizes="64px"
            className="h-16 w-16 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-brand-green-soft text-2xl font-extrabold text-brand-green-strong"
          >
            {initial}
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
          <span className="line-clamp-2 text-base font-bold text-ink">{topic.title}</span>
          {topic.myVote ? (
            <span className="sr-only">
              {topic.myVote === "UP" ? "Has votado a favor" : "Has votado en contra"}
            </span>
          ) : null}
          <span className="flex flex-wrap items-center gap-1.5">
            <span className={`${chipClass} ${chipTone[tone]}`}>
              {topic.totalVotes === 1 ? "1 voto" : `${topic.totalVotes} votos`}
            </span>
            <time
              dateTime={topic.createdAt}
              className={`${chipClass} bg-surface-muted text-ink-muted`}
            >
              <span className="sr-only">Creado </span>
              {formatRelativeDate(topic.createdAt)}
            </time>
            {topic.results ? (
              <>
                <VoteCount direction="up" count={topic.results.positiveVotes} />
                <VoteCount direction="down" count={topic.results.negativeVotes} />
              </>
            ) : null}
            {topic.visibility === "PRIVATE" ? (
              <span className="rounded-full bg-brand-green-soft px-2.5 py-0.5 text-xs font-bold text-brand-green-strong">
                Privado
              </span>
            ) : null}
          </span>
        </span>
      </Link>
    </li>
  );
}

function VoteCount({ direction, count }: { direction: "up" | "down"; count: number }) {
  const label = direction === "up" ? "a favor" : "en contra";
  const tone =
    direction === "up"
      ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
      : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
  return (
    <span className={`${chipClass} inline-flex items-center gap-1 ${tone}`}>
      <ThumbIcon direction={direction} className="h-3.5 w-3.5" />
      <span aria-hidden>{count}</span>
      <span className="sr-only">{`${count} ${label}`}</span>
    </span>
  );
}
