import type { Phase } from "./state";

type PhaseMeta = {
  label: string;
  /** Classes `stroke-*` de l'anneau. */
  fill: string;
  track: string;
  /** Couleur du libellé de phase. */
  text: string;
  /** Pastille de phase (fond + texte teintés). */
  pill: string;
  /** Notification affichée quand cette phase se termine. */
  endTitle: string;
  endBody: string;
};

export const PHASE_META: Record<Phase, PhaseMeta> = {
  work: {
    label: "Concentration",
    fill: "stroke-rose-500 dark:stroke-rose-400",
    track: "stroke-default",
    text: "text-rose-700 dark:text-rose-300",
    pill: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    endTitle: "Session terminée",
    endBody: "Bravo ! C'est l'heure de faire une pause.",
  },
  short_break: {
    label: "Pause courte",
    fill: "stroke-emerald-500 dark:stroke-emerald-400",
    track: "stroke-default",
    text: "text-emerald-700 dark:text-emerald-300",
    pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    endTitle: "Fin de la pause",
    endBody: "On s'y remet ?",
  },
  long_break: {
    label: "Pause longue",
    fill: "stroke-sky-500 dark:stroke-sky-400",
    track: "stroke-default",
    text: "text-sky-700 dark:text-sky-300",
    pill: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    endTitle: "Fin de la pause longue",
    endBody: "Nouveau cycle : au travail !",
  },
};
