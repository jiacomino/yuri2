/**
 * Alertes affichées au premier plan : fenêtre modale par-dessus l'app (`AlertOverlay`,
 * montée dans `AppShell`) et fenêtre yuri2 ramenée devant les autres applications.
 */
import { useSyncExternalStore } from "react";

export type AppAlert = {
  id: string;
  title: string;
  /** Ligne secondaire (horaire, échéance…). */
  subtitle?: string;
  body?: string;
  /** Teinte de la pastille (couleur de la tâche ou de son application). */
  color?: string;
};

let queue: AppAlert[] = [];
const listeners = new Set<() => void>();
const snoozes = new Map<string, number>();

function emit(next: AppAlert[]) {
  queue = next;
  listeners.forEach((l) => l());
  if (queue.length === 0) void releaseWindow();
}

/** Ajoute une alerte (remplace celle de même id) et amène la fenêtre au premier plan. */
export function showAlert(alert: AppAlert): void {
  emit([...queue.filter((a) => a.id !== alert.id), alert]);
  void bringToFront();
}

export function dismissAlert(id: string): void {
  emit(queue.filter((a) => a.id !== id));
}

/** Ferme l'alerte et la réaffiche dans `minutes` (non conservé après redémarrage). */
export function snoozeAlert(id: string, minutes: number, onFire?: (alert: AppAlert) => void): void {
  const alert = queue.find((a) => a.id === id);
  if (!alert) return;
  dismissAlert(id);
  window.clearTimeout(snoozes.get(id));
  snoozes.set(
    id,
    window.setTimeout(() => {
      snoozes.delete(id);
      showAlert(alert);
      onFire?.(alert);
    }, minutes * 60_000),
  );
}

export function useAlerts(): AppAlert[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => queue,
  );
}

async function bringToFront(): Promise<void> {
  try {
    const { getCurrentWindow, UserAttentionType } = await import("@tauri-apps/api/window");
    const win = getCurrentWindow();
    await win.unminimize();
    await win.show();
    await win.setAlwaysOnTop(true);
    await win.setFocus();
    // Windows peut refuser le focus à une app en arrière-plan : la barre des tâches clignote.
    await win.requestUserAttention(UserAttentionType.Critical);
  } catch (err) {
    console.warn("[alert] impossible d'amener la fenêtre au premier plan", err);
  }
}

/** La fenêtre reste au-dessus des autres tant qu'une alerte est ouverte, puis redevient normale. */
async function releaseWindow(): Promise<void> {
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const win = getCurrentWindow();
    await win.setAlwaysOnTop(false);
    await win.requestUserAttention(null);
  } catch {
    // hors Tauri (aperçu navigateur)
  }
}
