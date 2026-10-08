import type { TodoPriority } from "./state";

export type PriorityConfig = {
  id: TodoPriority | "none";
  label: string;
  /** Couleur du drapeau / du texte. */
  color: string;
  /** Couleur de la pastille de priorité affichée sur la tâche. */
  dot: string;
};

/** Du plus urgent au moins urgent ; « none » = pas de priorité. */
export const PRIORITIES: PriorityConfig[] = [
  { id: "urgent", label: "Urgent", color: "text-red-500", dot: "bg-red-500" },
  { id: "high", label: "Important", color: "text-amber-500", dot: "bg-amber-500" },
  { id: "normal", label: "Normal", color: "text-slate-400 dark:text-slate-500", dot: "bg-slate-400 dark:bg-slate-500" },
  { id: "low", label: "Basse", color: "text-sky-400", dot: "bg-sky-400" },
  { id: "none", label: "Aucune", color: "text-muted", dot: "bg-transparent" },
];

export function priorityConfig(p: TodoPriority | undefined): PriorityConfig {
  return PRIORITIES.find((x) => x.id === p) ?? PRIORITIES[PRIORITIES.length - 1];
}
