import { idleTimer, type TimerState } from "./timer";

export type Phase = "work" | "short_break" | "long_break";

export type PomodoroConfig = {
  workMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  /** Nombre de sessions de travail avant une pause longue. */
  sessionsBeforeLong: number;
  /** Enchaîne automatiquement la phase suivante à la fin du minuteur. */
  autoStart: boolean;
  /** Joue un carillon à la fin de chaque phase. */
  sound: boolean;
};

export type PomodoroState = {
  config: PomodoroConfig;
  phase: Phase;
  /** Sessions de travail terminées depuis la dernière remise à zéro. */
  completed: number;
  timer: TimerState;
};

export const MINUTES_RANGE = { min: 1, max: 180 } as const;
export const SESSIONS_RANGE = { min: 1, max: 12 } as const;

export const DEFAULT_CONFIG: PomodoroConfig = {
  workMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  sessionsBeforeLong: 4,
  autoStart: true,
  sound: true,
};

export function defaultState(): PomodoroState {
  return { config: { ...DEFAULT_CONFIG }, phase: "work", completed: 0, timer: idleTimer() };
}

export function demoState(): PomodoroState {
  return {
    config: { ...DEFAULT_CONFIG, workMin: 30, longBreakMin: 20 },
    phase: "work",
    completed: 2,
    // Session en pause à mi-parcours : 14 min 32 s restantes.
    timer: { endAt: null, remainingMs: (14 * 60 + 32) * 1000 },
  };
}

export function phaseDurationMs(phase: Phase, cfg: PomodoroConfig): number {
  const min = phase === "work" ? cfg.workMin : phase === "short_break" ? cfg.shortBreakMin : cfg.longBreakMin;
  return min * 60_000;
}

/** Phase qui suit `phase`, sachant `completed` sessions de travail déjà terminées. */
export function nextPhase(phase: Phase, completed: number, cfg: PomodoroConfig): Phase {
  if (phase !== "work") return "work";
  return (completed + 1) % cfg.sessionsBeforeLong === 0 ? "long_break" : "short_break";
}
