import { NotificationList } from "@/components/notifications/NotificationList";

/** NotificationsPage (TKT-031, HU-12): lista cargada desde el cliente con scroll infinito (TKT-045). */
export default function NotificationsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="px-4 py-4">
        <h1 className="text-2xl font-extrabold">Notificaciones</h1>
      </div>
      <NotificationList />
    </div>
  );
}
