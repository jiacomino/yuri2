/**
 * Pont optionnel vers un groupe Calendrier : une action peut y être copiée sous
 * forme de tâche. Rien n'est lié ensuite — la tâche vit sa vie dans le calendrier.
 *
 * `BodyProps` n'offre pas encore de canal entre groupes : le parent fournit
 * (ou non) `calendars` et `onSendToCalendar`. Sans calendrier, l'UI est masquée.
 */
import type { CalendarTaskPayload } from "@/lib/calendarLink";
import type { AppTag, WorkflowAction } from "./state";

export type CalendarTarget = { id: string; name: string };

export type SendToCalendar = (calendarId: string, task: CalendarTaskPayload) => void;

/** Construit la tâche à envoyer ; `start` est une valeur `datetime-local`. */
export function buildCalendarTask(
  action: WorkflowAction,
  apps: AppTag[],
  start: string,
  durationMin: number,
  allDay: boolean,
): CalendarTaskPayload | undefined {
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) return undefined;
  const app = apps.find((a) => a.id === action.appId);
  const common = {
    title: action.title,
    priority: action.priority,
    notes: action.notes,
    app: app ? { name: app.name, color: app.color } : undefined,
  };
  if (allDay) {
    const dayStart = new Date(startDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    return { ...common, start: dayStart.toISOString(), end: dayEnd.toISOString(), allDay: true };
  }
  return {
    ...common,
    start: startDate.toISOString(),
    end: new Date(startDate.getTime() + durationMin * 60_000).toISOString(),
    allDay: false,
  };
}
