import { useEffect } from "react";
import { fireAlarmNotification } from "@/lib/alarm";
import { notify } from "@/lib/notify";
import type { TodoItem, TodoState } from "./state";

const ALARM_TICK_MS = 15_000;

/**
 * Surveille les alarmes des tâches (au montage, à chaque changement et toutes les 15 s).
 * Une alarme échue non déclenchée sonne, notifie, puis est marquée `alarmFired`.
 */
export function useTodoAlarms(value: TodoState, onChange: (next: TodoState) => void) {
  useEffect(() => {
    function scan() {
      const now = Date.now();
      const due: TodoItem[] = [];
      for (const tab of value.tabs) {
        for (const item of tab.items) {
          if (!item.alarmAt || item.alarmFired) continue;
          const t = new Date(item.alarmAt).getTime();
          if (!Number.isNaN(t) && now >= t) due.push(item);
        }
      }
      if (due.length === 0) return;
      due.forEach((item, i) => {
        const body = item.text.trim() || "Tâche sans titre";
        notify({ title: "Rappel de tâche", body, kind: "alarm" });
        // Un seul son pour la salve de rappels.
        void fireAlarmNotification("yuri — tâches", body, { sound: i === 0 });
      });
      const dueIds = new Set(due.map((i) => i.id));
      onChange({
        ...value,
        tabs: value.tabs.map((tab) => ({
          ...tab,
          items: tab.items.map((i) => (dueIds.has(i.id) ? { ...i, alarmFired: true } : i)),
        })),
      });
    }
    scan();
    const id = window.setInterval(scan, ALARM_TICK_MS);
    return () => window.clearInterval(id);
  }, [value, onChange]);
}
