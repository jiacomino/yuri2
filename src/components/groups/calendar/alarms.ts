import type { CalendarTask } from "./state";

/** Délais d'alerte proposés, en minutes avant le début. */
export const ALARM_PRESETS: { minutes: number; label: string }[] = [
  { minutes: 0, label: "À l'heure" },
  { minutes: 5, label: "5 min" },
  { minutes: 15, label: "15 min" },
  { minutes: 30, label: "30 min" },
  { minutes: 60, label: "1 h" },
  { minutes: 120, label: "2 h" },
  { minutes: 24 * 60, label: "1 jour" },
];

/** Instant ISO où l'alerte de la tâche doit se déclencher, ou `null` sans alerte. */
export function alarmInstant(task: CalendarTask): string | null {
  if (task.alarmMinutesBefore === undefined) return null;
  const start = new Date(task.start).getTime();
  if (Number.isNaN(start)) return null;
  return new Date(start - task.alarmMinutesBefore * 60_000).toISOString();
}

/**
 * Vrai si l'alerte est échue et pas encore déclenchée. Une tâche déjà terminée ne sonne
 * plus (app fermée pendant la tâche, tâche déplacée dans le passé).
 */
export function isAlarmDue(task: CalendarTask, now: number): boolean {
  const at = alarmInstant(task);
  if (!at || task.alarmFiredAt === at) return false;
  const end = new Date(task.end).getTime();
  return now >= new Date(at).getTime() && !(now >= end);
}

export function formatAlarmWhen(iso: string): string {
  const dt = new Date(iso);
  const time = dt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const date = dt.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
  return `${date} à ${time}`;
}
