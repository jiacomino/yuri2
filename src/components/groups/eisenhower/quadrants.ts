import type { Quadrant } from "./state";

export type QuadrantMeta = {
  id: Quadrant;
  label: string;
  hint: string;
  /** Teinte de la zone (avec variante sombre). */
  zoneClass: string;
  /** Couleur du titre. */
  titleClass: string;
  /** Pastille de l'en-tête. */
  dotClass: string;
};

export const QUADRANTS: QuadrantMeta[] = [
  {
    id: "do",
    label: "Faire",
    hint: "Urgent · Important",
    zoneClass: "bg-red-50 dark:bg-red-500/10",
    titleClass: "text-red-700 dark:text-red-300",
    dotClass: "bg-red-500",
  },
  {
    id: "schedule",
    label: "Planifier",
    hint: "Pas urgent · Important",
    zoneClass: "bg-indigo-50 dark:bg-indigo-500/10",
    titleClass: "text-indigo-700 dark:text-indigo-300",
    dotClass: "bg-indigo-500",
  },
  {
    id: "delegate",
    label: "Déléguer",
    hint: "Urgent · Pas important",
    zoneClass: "bg-amber-50 dark:bg-amber-500/10",
    titleClass: "text-amber-700 dark:text-amber-300",
    dotClass: "bg-amber-500",
  },
  {
    id: "eliminate",
    label: "Éliminer",
    hint: "Pas urgent · Pas important",
    zoneClass: "bg-slate-100 dark:bg-slate-500/10",
    titleClass: "text-slate-700 dark:text-slate-300",
    dotClass: "bg-slate-400",
  },
];

export function quadrantLabel(id: Quadrant): string {
  return QUADRANTS.find((q) => q.id === id)?.label ?? "Tâche";
}
