import { toast } from "@heroui/react";

export type NotifyKind = "info" | "alarm" | "success";

export type NotifyOpts = {
  title: string;
  body?: string;
  durationMs?: number;
  /** Variante visuelle. Par défaut "info". */
  kind?: NotifyKind;
  /** Bouton dans la notification (ex. « Annuler ») ; la ferme une fois pressé. */
  action?: { label: string; onPress: () => void };
};

/**
 * Notification dans l'app (toast HeroUI). Nécessite `<Toast.Provider />`, monté dans
 * `App.tsx`. Pour une notification système Windows, voir `fireAlarmNotification`.
 */
export function notify({ title, body, durationMs, kind = "info", action }: NotifyOpts): void {
  let id = "";
  const options = {
    description: body,
    timeout: durationMs ?? (kind === "alarm" ? 0 : 6000),
    actionProps: action && {
      children: action.label,
      onPress: () => {
        action.onPress();
        toast.close(id);
      },
    },
  };
  if (kind === "success") id = toast.success(title, options);
  else if (kind === "alarm") id = toast.danger(title, options);
  else id = toast.info(title, options);
}
