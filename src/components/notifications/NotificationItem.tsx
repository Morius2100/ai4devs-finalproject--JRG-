import Link from "next/link";
import type { NotificationItem as NotificationItemType } from "@/server/services/notification-service";

/**
 * Notificación de tema privado (TKT-031): "<usuario> ha creado una nueva
 * propuesta: <título>", enlaza al tema. Sin texto almacenado: se compone
 * aquí a partir de `actor.username` y `topic.title`.
 */
export function NotificationItem({ notification }: { notification: NotificationItemType }) {
  return (
    <li>
      <Link
        href={`/tema?id=${notification.topic.id}`}
        className="flex min-h-16 items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-sm hover:bg-surface-muted"
      >
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-green-soft text-lg"
        >
          🔔
        </span>
        <span>
          <strong>{notification.actor.username}</strong> ha creado una nueva propuesta:{" "}
          {notification.topic.title}
        </span>
      </Link>
    </li>
  );
}
