import { useCallback, useEffect, useRef } from "react";
import { fireAlarmNotification } from "@/lib/alarm";
import { notify } from "@/lib/notify";
import { quadrantLabel } from "./quadrants";
import { QUADRANT_IDS, type EisenhowerState, type EisenhowerTask, type Quadrant } from "./state";

const ALARM_TICK_MS = 15_000;

/**
 * Surveille les alarmes de toutes les tâches : à l'échéance, son + toast + notification
 * système, puis la tâche est marquée `alarmFired`.
 */
export function useTaskAlarms(value: EisenhowerState, onChange: (next: EisenhowerState) => void) {
  const latest = useRef({ value, onChange });
  useEffect(() => {
    latest.current = { value, onChange };
  });

  const scan = useCallback(() => {
    const { value: state, onChange: emit } = latest.current;
    const now = Date.now();
    const due: { q: Quadrant; task: EisenhowerTask }[] = [];
    for (const q of QUADRANT_IDS) {
      for (const task of state.tasks[q]) {
        if (!task.alarmAt || task.alarmFired) continue;
        const at = new Date(task.alarmAt).getTime();
        if (!Number.isNaN(at) && now >= at) due.push({ q, task });
      }
    }
    if (due.length === 0) return;

    due.forEach(({ q, task }, i) => {
      const label = quadrantLabel(q);
      const body = task.text.trim() || "Tâche sans titre";
      notify({ title: `Rappel · ${label}`, body, kind: "alarm", durationMs: 12_000 });
      // Un seul son pour la salve de rappels.
      void fireAlarmNotification(`Rappel · ${label}`, body, { sound: i === 0 });
    });

    const ids = new Set(due.map((d) => d.task.id));
    const tasks = { ...state.tasks };
    for (const q of QUADRANT_IDS) {
      tasks[q] = state.tasks[q].map((t) => (ids.has(t.id) ? { ...t, alarmFired: true } : t));
    }
    emit({ tasks });
  }, []);

  // Vérifie à chaque modification des tâches…
  useEffect(() => {
    scan();
  }, [value.tasks, scan]);

  // …et périodiquement.
  useEffect(() => {
    const id = window.setInterval(scan, ALARM_TICK_MS);
    return () => window.clearInterval(id);
  }, [scan]);
}
