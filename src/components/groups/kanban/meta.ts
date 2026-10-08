import type { CSSProperties } from "react";
import type { CardPriority } from "./state";

export const PRIORITY_ORDER: CardPriority[] = ["urgent", "important", "normal", "low"];

export const PRIORITY_META: Record<CardPriority, { label: string; chip: string; dot: string }> = {
  urgent: {
    label: "Urgent",
    chip: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
    dot: "bg-red-500",
  },
  important: {
    label: "Important",
    chip: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  normal: { label: "Normal", chip: "bg-default text-muted", dot: "bg-slate-400 dark:bg-slate-500" },
  low: {
    label: "Faible",
    chip: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    dot: "bg-sky-400",
  },
};

/** Couleur de la pastille d'en-tête de colonne, déduite du nom (purement visuel). */
export function columnDotColor(name: string): string {
  const n = name.toLowerCase();
  if (/(termin|fait|done|fini|clos)/.test(n)) return "#10b981";
  if (/(en cours|doing|progress|wip)/.test(n)) return "var(--accent)";
  if (/(bloq|attente|review|relecture|valid)/.test(n)) return "#f59e0b";
  return "#94a3b8";
}

/** Couleurs attribuées tour à tour aux nouvelles applications. */
export const APP_COLORS = ["#4f7cff", "#a855f7", "#10b981", "#f59e0b", "#ec4899", "#06b6d4", "#ef4444", "#64748b"];

export function nextAppColor(count: number): string {
  return APP_COLORS[count % APP_COLORS.length];
}

/** Style teinté (texte, fond) d'une pastille d'application. */
export function appChipStyle(color: string): CSSProperties {
  return { color, backgroundColor: `${color}1f` };
}
