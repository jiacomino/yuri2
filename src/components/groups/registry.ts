import type { GroupDefinition, GroupKind } from "./types";
import { linksGroup } from "./links";
import { textGroup } from "./text";
import { markdownGroup } from "./markdown";
import { postitGroup } from "./postit";
import { todoGroup } from "./todo";
import { kanbanGroup } from "./kanban";
import { eisenhowerGroup } from "./eisenhower";
import { pomotaskGroup } from "./pomotask";
import { pomodoroGroup } from "./pomodoro";
import { postureGroup } from "./posture";
import { calendarGroup } from "./calendar";
import { gcalendarGroup } from "./gcalendar";
import { mindmapGroup } from "./mindmap";
import { workflowGroup } from "./workflow";
import { imageGroup } from "./image";
import { passwordGroup } from "./password";
import { timetrackGroup } from "./timetrack";
import { goalsGroup } from "./goals";
import { clipboardGroup } from "./clipboard";
import { launcherGroup } from "./launcher";

/** Tous les types de groupe, dans l'ordre du menu « Ajouter ». */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const groupDefinitions: GroupDefinition<any>[] = [
  linksGroup,
  textGroup,
  markdownGroup,
  postitGroup,
  todoGroup,
  kanbanGroup,
  eisenhowerGroup,
  pomotaskGroup,
  pomodoroGroup,
  postureGroup,
  calendarGroup,
  gcalendarGroup,
  mindmapGroup,
  workflowGroup,
  imageGroup,
  passwordGroup,
  timetrackGroup,
  goalsGroup,
  clipboardGroup,
  launcherGroup,
];

export function findDefinition(kind: GroupKind): GroupDefinition<unknown> | undefined {
  return groupDefinitions.find((d) => d.kind === kind);
}

/** Phrase de présentation de chaque type, affichée dans la fenêtre « Ajouter un composant ». */
export const groupDescriptions: Record<GroupKind, string> = {
  links: "Favoris rangés en onglets, avec séparateurs.",
  text: "Notes en texte riche : gras, couleurs, listes, liens.",
  markdown: "Notes en Markdown avec aperçu.",
  postit: "Pense-bête rapide, avec alarme.",
  todo: "Listes de tâches avec sous-tâches, priorités et alarmes.",
  kanban: "Colonnes et cartes à déplacer.",
  eisenhower: "Tâches classées par urgence et importance.",
  pomotask: "Tâches estimées en pomodoros, avec minuteur.",
  pomodoro: "Minuteur de travail et de pauses.",
  posture: "Alterner assis et debout, avec rappels.",
  calendar: "Agenda local : semaine, jour, mois.",
  gcalendar: "Prochains événements de Google Agenda.",
  mindmap: "Carte mentale d'idées reliées.",
  workflow: "Suivi de projet par étapes et actions.",
  image: "Image à annoter : flèches, cadres, texte.",
  password: "Identifiants rangés en onglets.",
  timetrack: "Chrono par tâche et projet, totaux du jour et de la semaine.",
  goals: "Objectifs par étapes ou chiffrés, avec avancement et échéance.",
  clipboard: "Historique des textes et images copiés, à recopier en un clic.",
  launcher: "Applications Windows à lancer d'un clic, choisies parmi celles installées.",
};
