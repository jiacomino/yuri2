/**
 * Assis / debout yuri 1 → yuri2. Mêmes champs ; le minuteur repart à l'arrêt (un minuteur
 * en marche dans yuri 1 est remis au début de sa phase, une pause garde son temps restant).
 * Les totaux du jour sont conservés : yuri2 les remet à zéro si `statsDate` est dépassé.
 */
import { MAX_PHASE_MIN, MIN_PHASE_MIN } from "@/components/groups/posture/timer";
import { dayKey, defaultPostureState, type PostureState } from "@/components/groups/posture/state";
import type { Converter } from "../types";
import { bool, isObj, num, str } from "./util";

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export const convertPosture: Converter<PostureState> = (raw) => {
  const def = defaultPostureState();
  if (!isObj(raw)) return def;
  const sitMin = clamp(num(raw.sitMin, def.sitMin), MIN_PHASE_MIN, MAX_PHASE_MIN);
  const standMin = clamp(num(raw.standMin, def.standMin), MIN_PHASE_MIN, MAX_PHASE_MIN);
  const currentPhase = raw.currentPhase === "stand" ? "stand" : "sit";
  const fullSec = (currentPhase === "sit" ? sitMin : standMin) * 60;
  const paused = !bool(raw.running) ? num(raw.remainingSecAtPause, NaN) : NaN;
  const statsDate = str(raw.statsDate);
  return {
    ...def,
    sitMin,
    standMin,
    soundEnabled: bool(raw.soundEnabled, true),
    currentPhase,
    remainingSecAtPause: paused > 0 && paused <= fullSec ? paused : fullSec,
    statsDate: /^\d{4}-\d{2}-\d{2}$/.test(statsDate) ? statsDate : dayKey(),
    sitTotalSec: clamp(num(raw.sitTotalSec, 0), 0, 24 * 3600),
    standTotalSec: clamp(num(raw.standTotalSec, 0), 0, 24 * 3600),
  };
};
