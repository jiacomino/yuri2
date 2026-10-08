import type { Priority } from "./state";

/** Libellé et classes visuelles de chaque priorité (lisibles en clair comme en sombre). */
export const PRIORITY_META: Record<Priority, { label: string; text: string; chip: string }> = {
  urgent: {
    label: "Urgent",
    text: "text-red-500",
    chip: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  },
  high: {
    label: "Important",
    text: "text-amber-500",
    chip: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
  normal: { label: "Normal", text: "text-muted", chip: "bg-default text-muted" },
  low: {
    label: "Basse",
    text: "text-sky-500",
    chip: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  },
};

/** Forme commune des pastilles (priorité, échéance, application…). */
export const chipClass = "inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[0.8148rem] font-bold";
