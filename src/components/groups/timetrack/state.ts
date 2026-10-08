import { genId } from "@/lib/id";

/** Projet auquel on impute du temps. */
export type TimeProject = { id: string; name: string; color: string };

/** Plage de travail. `end` nul = chrono en cours (au plus une plage à la fois). */
export type TimeEntry = {
  id: string;
  label: string;
  projectId: string | null;
  /** Dates ISO. */
  start: string;
  end: string | null;
};

export type TimeTrackState = {
  projects: TimeProject[];
  entries: TimeEntry[];
};

export const PROJECT_COLORS = ["#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899", "#ef4444", "#6366f1", "#64748b"];

export function defaultState(): TimeTrackState {
  return { projects: [], entries: [] };
}

export function demoState(): TimeTrackState {
  const at = (h: number, m: number, daysAgo = 0) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };
  return {
    projects: [
      { id: "p-site", name: "Site vitrine", color: "#0ea5e9" },
      { id: "p-mobile", name: "App mobile", color: "#8b5cf6" },
      { id: "p-admin", name: "Administratif", color: "#64748b" },
    ],
    entries: [
      { id: "e1", label: "Maquette page d'accueil", projectId: "p-site", start: at(9, 0), end: at(10, 35) },
      { id: "e2", label: "Mails et point équipe", projectId: "p-admin", start: at(10, 45), end: at(11, 20) },
      { id: "e3", label: "Écran de connexion", projectId: "p-mobile", start: at(13, 30), end: at(15, 10) },
      { id: "e4", label: "Intégration du menu", projectId: "p-site", start: at(14, 0, 1), end: at(17, 30, 1) },
      {
        id: "e5",
        label: "Revue de code",
        projectId: "p-mobile",
        start: new Date(Date.now() - 23 * 60_000).toISOString(),
        end: null,
      },
    ],
  };
}

// ─── Calculs ────────────────────────────────────────────────────────────────

export function entryMs(e: TimeEntry, now: number): number {
  const end = e.end ? new Date(e.end).getTime() : now;
  return Math.max(0, end - new Date(e.start).getTime());
}

export function runningEntry(state: TimeTrackState): TimeEntry | undefined {
  return state.entries.find((e) => e.end === null);
}

export type Period = "day" | "week";

/** Début de la période contenant `now` (minuit, ou lundi minuit). */
export function periodStart(period: Period, now: number): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  if (period === "week") d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

/** Temps passé depuis `from` (portion des plages à cheval comprise), par projet. */
export function totalsSince(state: TimeTrackState, from: number, now: number): Map<string | null, number> {
  const totals = new Map<string | null, number>();
  for (const e of state.entries) {
    const start = Math.max(new Date(e.start).getTime(), from);
    const end = e.end ? new Date(e.end).getTime() : now;
    if (end <= start) continue;
    totals.set(e.projectId, (totals.get(e.projectId) ?? 0) + end - start);
  }
  return totals;
}

/** « 1 h 05 », « 12 min », « 45 s » ; `withSeconds` pour le chrono en cours (« 1:05:09 »). */
export function formatDuration(ms: number, withSeconds = false): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (withSeconds) return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  if (h > 0) return `${h} h ${pad(m)}`;
  return m > 0 ? `${m} min` : `${s} s`;
}

// ─── Opérations ─────────────────────────────────────────────────────────────

/** Arrête le chrono en cours (s'il y en a un). */
export function stop(state: TimeTrackState, now = new Date().toISOString()): TimeTrackState {
  return { ...state, entries: state.entries.map((e) => (e.end === null ? { ...e, end: now } : e)) };
}

/** Démarre une plage ; le chrono en cours éventuel est d'abord arrêté. */
export function start(state: TimeTrackState, label: string, projectId: string | null): TimeTrackState {
  const now = new Date().toISOString();
  const stopped = stop(state, now);
  const entry: TimeEntry = { id: genId(), label: label.trim(), projectId, start: now, end: null };
  return { ...stopped, entries: [entry, ...stopped.entries] };
}

export function addProject(state: TimeTrackState, name: string): TimeTrackState {
  const clean = name.trim();
  if (!clean) return state;
  const color = PROJECT_COLORS[state.projects.length % PROJECT_COLORS.length];
  return { ...state, projects: [...state.projects, { id: genId(), name: clean, color }] };
}

/** Supprime un projet ; ses plages restent, sans projet. */
export function removeProject(state: TimeTrackState, id: string): TimeTrackState {
  return {
    projects: state.projects.filter((p) => p.id !== id),
    entries: state.entries.map((e) => (e.projectId === id ? { ...e, projectId: null } : e)),
  };
}
