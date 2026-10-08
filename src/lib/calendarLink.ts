/**
 * Ajout d'une tâche dans un groupe calendrier depuis un autre composant (suivi de
 * projet, Kanban…). Seul point d'écriture hors de `CalendarBody`, pour garder la forme
 * de `CalendarState` en un seul endroit.
 */
import type { CalendarState, CalendarTask, Priority } from "@/components/groups/calendar/state";

export type CalendarTaskPriority = Priority;

export type CalendarTaskPayload = {
  title: string;
  /** Date-heure ISO. */
  start: string;
  /** Date-heure ISO ; fin exclusive pour une journée entière. */
  end: string;
  allDay: boolean;
  priority: CalendarTaskPriority;
  notes?: string;
  /** Retrouvée par nom (sans casse) dans le calendrier cible, créée sinon. */
  app?: { name: string; color: string };
};

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

/** Renvoie un nouvel état de calendrier avec `task` ajoutée (état d'origine intact). */
export function addTaskToCalendar(state: CalendarState, task: CalendarTaskPayload): CalendarState {
  const apps = [...state.apps];

  let appId: string | undefined;
  if (task.app) {
    const wanted = task.app.name.trim().toLowerCase();
    const existing = apps.find((a) => a.name.trim().toLowerCase() === wanted);
    if (existing) {
      appId = existing.id;
    } else {
      appId = genId();
      apps.push({ id: appId, name: task.app.name, color: task.app.color });
    }
  }

  const event: CalendarTask = {
    id: genId(),
    title: task.title,
    start: task.start,
    end: task.end,
    allDay: task.allDay,
    color: task.app?.color ?? "#4f7cff",
    priority: task.priority,
    appId,
    notes: task.notes ?? "",
  };

  return { ...state, apps, events: [...state.events, event] };
}

/**
 * Variante sur le contenu JSON brut (colonne `content` en SQLite). Un contenu vide
 * ou illisible repart d'un calendrier vide.
 */
export function addTaskToCalendarContent(content: string, task: CalendarTaskPayload): string {
  let state: CalendarState = { events: [], apps: [], view: "timeGridWeek" };
  try {
    const parsed = content ? (JSON.parse(content) as Partial<CalendarState> | null) : null;
    if (parsed && typeof parsed === "object") {
      state = {
        events: Array.isArray(parsed.events) ? parsed.events : [],
        apps: Array.isArray(parsed.apps) ? parsed.apps : [],
        view: parsed.view ?? "timeGridWeek",
      };
    }
  } catch {
    // contenu illisible : calendrier vide
  }
  return JSON.stringify(addTaskToCalendar(state, task));
}
