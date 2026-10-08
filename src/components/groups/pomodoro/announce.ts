import { fireAlarmNotification, requestNotificationPermission } from "@/lib/alarm";
import { notify } from "@/lib/notify";

/** Fin d'un minuteur : toast dans l'app et notification système, sonore si `sound`. */
export function announceTimerEnd({ title, body, sound = true }: { title: string; body: string; sound?: boolean }) {
  notify({ title, body, kind: "success", durationMs: 10_000 });
  void fireAlarmNotification(title, body, { sound });
}

/** À appeler au démarrage d'un minuteur pour que la notification de fin puisse s'afficher. */
export function warmUpNotifications() {
  void requestNotificationPermission();
}
