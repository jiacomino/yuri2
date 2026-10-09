import { useCallback, useEffect, useRef } from "react";
import { fireAlarmNotification } from "@/lib/alarm";
import { showAlert } from "@/lib/alertOverlay";
import type { GroupRecord } from "@/types/workspace";
import { alarmInstant, formatAlarmWhen, isAlarmDue } from "./alarms";
import type { CalendarState, CalendarTask } from "./state";

const ALARM_TICK_MS = 15_000;

function taskWhen(task: CalendarTask): string {
  if (task.allDay) return `${formatAlarmWhen(task.start).replace(/ à .*$/, "")} · journée entière`;
  const end = new Date(task.end).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${formatAlarmWhen(task.start)} – ${end}`;
}

/**
 * Surveille les alertes de TOUS les calendriers, affichés ou non (réduits, autre espace) :
 * monté une seule fois, dans `AppShell`. À l'échéance : alerte au premier plan, toast
 * Windows avec son, puis la tâche est marquée `alarmFiredAt`.
 */
export function useCalendarAlarms(
  groups: GroupRecord[],
  updateState: (id: string, fn: (state: unknown) => unknown) => void,
) {
  const groupsRef = useRef(groups);
  groupsRef.current = groups;

  const scan = useCallback(() => {
    const now = Date.now();
    let first = true;
    for (const g of groupsRef.current) {
      if (g.kind !== "calendar") continue;
      const state = g.state as CalendarState | null;
      const due = state?.events?.filter((t) => isAlarmDue(t, now)) ?? [];
      if (due.length === 0) continue;

      for (const task of due) {
        const app = state!.apps.find((a) => a.id === task.appId);
        const title = task.title.trim() || "Tâche sans titre";
        const when = taskWhen(task);
        showAlert({
          id: `calendar:${task.id}`,
          title,
          subtitle: app ? `${when} · ${app.name}` : when,
          body: task.notes.trim() || undefined,
          color: app?.color ?? task.color,
        });
        // Un seul son pour une salve de rappels.
        void fireAlarmNotification(`Rappel · ${title}`, when, { sound: first });
        first = false;
      }

      const fired = new Map(due.map((t) => [t.id, alarmInstant(t)!]));
      updateState(g.id, (s) => {
        const cur = s as CalendarState;
        return {
          ...cur,
          events: cur.events.map((t) => (fired.has(t.id) ? { ...t, alarmFiredAt: fired.get(t.id) } : t)),
        };
      });
    }
  }, [updateState]);

  // Vérifie à chaque modification (alerte posée sur une tâche imminente)…
  useEffect(() => {
    scan();
  }, [groups, scan]);

  // …et périodiquement.
  useEffect(() => {
    const id = window.setInterval(scan, ALARM_TICK_MS);
    return () => window.clearInterval(id);
  }, [scan]);
}
