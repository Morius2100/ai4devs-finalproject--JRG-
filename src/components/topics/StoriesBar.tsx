"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Avatar } from "@/components/people/Avatar";
import { fetchStories } from "@/lib/api/stories";

/**
 * Historias de amigos (TKT-057, HU-19): una burbuja por amigo con temas
 * creados en las últimas 24 h que aún no ha abierto. Pulsarla abre el tema
 * pendiente más antiguo. Sin historias (o mientras carga o si falla) no
 * pinta nada ni deja hueco, para que la lista no salte.
 */
export function StoriesBar() {
  const { data } = useQuery({ queryKey: ["stories"], queryFn: fetchStories });

  if (!data || data.items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Historias de tus amigos" className="px-4 pt-4">
      <ul className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-1">
        {data.items.map((story) => {
          const count = story.topicIds.length;
          const name = story.author.username;
          return (
            <li key={story.author.id} className="shrink-0 snap-start">
              <Link
                href={`/tema?id=${story.topicIds[0]}`}
                aria-label={
                  count === 1 ? `Nuevo tema de ${name}` : `${count} temas nuevos de ${name}`
                }
                className="flex w-[72px] flex-col items-center gap-1"
              >
                <span className="relative rounded-full bg-[conic-gradient(var(--brand-yellow),var(--brand-green),var(--brand-yellow))] p-[3px]">
                  <span className="block rounded-full bg-surface p-0.5">
                    <Avatar username={name} avatarUrl={story.author.avatarUrl} size={60} />
                  </span>
                  {count > 1 ? (
                    <span
                      aria-hidden
                      className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-green px-1 text-xs font-bold text-white"
                    >
                      {count}
                    </span>
                  ) : null}
                </span>
                <span
                  aria-hidden
                  className="w-full truncate text-center text-xs font-semibold text-ink"
                >
                  {name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
