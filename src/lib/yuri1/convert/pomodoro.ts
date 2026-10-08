/**
 * Pomodoro yuri 1 → yuri2. Yuri 1 ne persistait que la configuration (durées, sessions) ;
 * le minuteur repart à l'arrêt, en phase de travail. `autoStart` / `sound` : valeurs par défaut.
 */
import {
  DEFAULT_CONFIG,
  MINUTES_RANGE,
  SESSIONS_RANGE,
  defaultState,
  type PomodoroState,
} from "@/components/groups/pomodoro/state";
import type { Converter } from "../types";
import { isObj, num } from "./util";

const clamp = (v: unknown, fallback: number, r: { min: number; max: number }) =>
  Math.max(r.min, Math.min(r.max, Math.floor(num(v, fallback))));

export const convertPomodoro: Converter<PomodoroState> = (raw) => {
  const state = defaultState();
  if (!isObj(raw)) return state;
  state.config = {
    ...DEFAULT_CONFIG,
    workMin: clamp(raw.workMin, DEFAULT_CONFIG.workMin, MINUTES_RANGE),
    shortBreakMin: clamp(raw.shortBreakMin, DEFAULT_CONFIG.shortBreakMin, MINUTES_RANGE),
    longBreakMin: clamp(raw.longBreakMin, DEFAULT_CONFIG.longBreakMin, MINUTES_RANGE),
    sessionsBeforeLong: clamp(raw.sessionsBeforeLong, DEFAULT_CONFIG.sessionsBeforeLong, SESSIONS_RANGE),
  };
  return state;
};
