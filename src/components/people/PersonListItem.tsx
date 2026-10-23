import Link from "next/link";
import { Avatar } from "@/components/people/Avatar";
import type { PersonSummary } from "@/server/services/user-service";

/**
 * Tarjeta de una persona en la lista (TKT-038): foto (o inicial), nombre de
 * usuario, etiqueta «Amigo» / «No amigo» y enlace a `/persona?id=`; área
 * táctil ≥ 44 px.
 */
export function PersonListItem({ person }: { person: PersonSummary }) {
  return (
    <li>
      <Link
        href={`/persona?id=${person.id}`}
        className="flex min-h-16 items-center gap-3 rounded-2xl border border-line bg-surface p-3 hover:bg-surface-muted"
      >
        <Avatar username={person.username} avatarUrl={person.avatarUrl} size={44} />
        <span className="min-w-0 flex-1 truncate text-base font-bold text-ink">
          {person.username}
        </span>
        {person.isFriend ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-green-soft px-2.5 py-1 text-xs font-extrabold text-brand-green-strong">
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m5 12.5 4.5 4.5L19 7" />
            </svg>
            Amigo
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-extrabold text-ink-muted">
            No amigo
          </span>
        )}
      </Link>
    </li>
  );
}
