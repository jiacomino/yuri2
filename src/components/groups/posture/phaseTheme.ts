import { Armchair, PersonStanding, type LucideIcon } from "lucide-react";
import type { Phase } from "./state";

/** Teintes douces : rose pour assis, émeraude pour debout. */
export type PhaseTheme = {
  label: string;
  icon: LucideIcon;
  text: string;
  textStrong: string;
  soft: string;
  /** Pastille de phase (fond + texte teintés). */
  pill: string;
  /** Point coloré (tuiles de stats, barre de répartition). */
  dot: string;
  ringTrack: string;
  ringStroke: string;
};

export const PHASE_THEME: Record<Phase, PhaseTheme> = {
  sit: {
    label: "Assis",
    icon: Armchair,
    text: "text-rose-600 dark:text-rose-300",
    textStrong: "text-rose-700 dark:text-rose-200",
    soft: "bg-rose-100 hover:bg-rose-200/70 dark:bg-rose-500/15 dark:hover:bg-rose-500/25",
    pill: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    dot: "bg-rose-500 dark:bg-rose-400",
    ringTrack: "text-default",
    ringStroke: "text-rose-500 dark:text-rose-400",
  },
  stand: {
    label: "Debout",
    icon: PersonStanding,
    text: "text-emerald-600 dark:text-emerald-300",
    textStrong: "text-emerald-700 dark:text-emerald-200",
    soft: "bg-emerald-100 hover:bg-emerald-200/70 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25",
    pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    dot: "bg-emerald-500 dark:bg-emerald-400",
    ringTrack: "text-default",
    ringStroke: "text-emerald-500 dark:text-emerald-400",
  },
};
