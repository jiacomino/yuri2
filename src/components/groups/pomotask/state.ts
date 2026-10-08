import { idleTimer, type TimerState } from "../pomodoro/timer";

/** Estimations proposées, en minutes. */
export const ESTIMATES = [5, 10, 15, 20, 25, 30, 45, 60] as const;
export const DEFAULT_ESTIMATE = 15;

export type PomoTask = {
  id: string;
  text: string;
  estimateMin: number;
};

export type PomoTaskState = {
  tasks: PomoTask[];
  /** Tâche chargée dans le minuteur. */
  activeTaskId: string | null;
  timer: TimerState;
};

export function defaultState(): PomoTaskState {
  return { tasks: [], activeTaskId: null, timer: idleTimer() };
}

export function demoState(): PomoTaskState {
  const tasks: PomoTask[] = [
    { id: "pt-1", text: "Relire le compte rendu de la réunion produit", estimateMin: 15 },
    { id: "pt-2", text: "Rédiger la note de cadrage du projet Atlas", estimateMin: 45 },
    { id: "pt-3", text: "Répondre aux mails clients en attente", estimateMin: 25 },
    { id: "pt-4", text: "Préparer les slides pour le point de jeudi", estimateMin: 30 },
    { id: "pt-5", text: "Mettre à jour le tableau de suivi budgétaire", estimateMin: 10 },
  ];
  return {
    tasks,
    activeTaskId: "pt-2",
    // En pause : 31 min 08 s restantes sur 45.
    timer: { endAt: null, remainingMs: (31 * 60 + 8) * 1000 },
  };
}

/** Estimation suivante dans la liste (cycle), pour le clic sur la pastille. */
export function nextEstimate(current: number): number {
  const idx = ESTIMATES.findIndex((e) => e === current);
  return ESTIMATES[(idx + 1) % ESTIMATES.length];
}
