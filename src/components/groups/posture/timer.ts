import { dayKey, type Phase, type PostureState } from "./state";

export const MIN_PHASE_MIN = 1;
export const MAX_PHASE_MIN = 180;

export function otherPhase(phase: Phase): Phase {
  return phase === "sit" ? "stand" : "sit";
}

export function phaseDurationSec(state: PostureState, phase: Phase): number {
  return (phase === "sit" ? state.sitMin : state.standMin) * 60;
}

/** Secondes restantes de la phase courante à l'instant `now`. */
export function remainingSec(state: PostureState, now: number): number {
  if (state.running) {
    return state.phaseEndAt !== null ? Math.max(0, (state.phaseEndAt - now) / 1000) : 0;
  }
  return state.remainingSecAtPause ?? phaseDurationSec(state, state.currentPhase);
}

function startOfDay(at: number): number {
  const d = new Date(at);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Crédite aux totaux le temps écoulé depuis `segmentStartAt` jusqu'à `until`, pour la
 * phase courante. Si le jour a changé, les totaux repartent de zéro et seul le temps
 * écoulé depuis minuit est compté. Le segment suivant démarre à `until`.
 */
export function credit(state: PostureState, until: number): PostureState {
  const today = dayKey(until);
  let { sitTotalSec, standTotalSec } = state;
  let from = state.segmentStartAt;
  if (state.statsDate !== today) {
    sitTotalSec = 0;
    standTotalSec = 0;
    if (from !== null) from = Math.max(from, startOfDay(until));
  }
  if (state.running && from !== null && until > from) {
    const sec = (until - from) / 1000;
    if (state.currentPhase === "sit") sitTotalSec += sec;
    else standTotalSec += sec;
  }
  return {
    ...state,
    statsDate: today,
    sitTotalSec,
    standTotalSec,
    segmentStartAt: state.running ? until : null,
  };
}

/** Totaux du jour, segment en cours inclus (affichage uniquement). */
export function liveTotals(state: PostureState, now: number): { sit: number; stand: number } {
  const c = credit(state, now);
  return { sit: c.sitTotalSec, stand: c.standTotalSec };
}

export function start(state: PostureState, now: number): PostureState {
  const remaining = state.remainingSecAtPause ?? phaseDurationSec(state, state.currentPhase);
  return {
    ...credit(state, now),
    running: true,
    phaseEndAt: now + remaining * 1000,
    remainingSecAtPause: null,
    segmentStartAt: now,
  };
}

export function pause(state: PostureState, now: number): PostureState {
  return {
    ...credit(state, now),
    running: false,
    phaseEndAt: null,
    remainingSecAtPause: remainingSec(state, now),
    segmentStartAt: null,
  };
}

/** Arrête le minuteur et remet la phase courante à sa durée complète. */
export function stop(state: PostureState, now: number): PostureState {
  return {
    ...credit(state, now),
    running: false,
    phaseEndAt: null,
    remainingSecAtPause: phaseDurationSec(state, state.currentPhase),
    segmentStartAt: null,
  };
}

/** Relance le compte à rebours de la phase courante, sans arrêter le minuteur. */
export function restartPhase(state: PostureState, now: number): PostureState {
  const credited = credit(state, now);
  return {
    ...credited,
    running: true,
    phaseEndAt: now + phaseDurationSec(state, state.currentPhase) * 1000,
    remainingSecAtPause: null,
    segmentStartAt: now,
  };
}

/** Bascule manuellement de phase ; le minuteur continue s'il tournait. */
export function switchPhase(state: PostureState, now: number): PostureState {
  const credited = credit(state, now);
  const next = otherPhase(state.currentPhase);
  const duration = phaseDurationSec(state, next);
  return state.running
    ? { ...credited, currentPhase: next, phaseEndAt: now + duration * 1000, remainingSecAtPause: null, segmentStartAt: now }
    : { ...credited, currentPhase: next, phaseEndAt: null, remainingSecAtPause: duration, segmentStartAt: null };
}

/**
 * Fin de phase atteinte : on ne crédite que jusqu'à `phaseEndAt` (le temps où l'app
 * était fermée ne compte pas), puis la phase suivante démarre maintenant.
 */
export function completePhase(state: PostureState, now: number): PostureState {
  const end = Math.min(now, state.phaseEndAt ?? now);
  const credited = credit(state, end);
  const next = otherPhase(state.currentPhase);
  return {
    ...credited,
    currentPhase: next,
    phaseEndAt: now + phaseDurationSec(state, next) * 1000,
    remainingSecAtPause: null,
    segmentStartAt: now,
  };
}

export function updateConfig(
  state: PostureState,
  patch: Partial<Pick<PostureState, "sitMin" | "standMin" | "soundEnabled">>,
): PostureState {
  const next = { ...state, ...patch };
  // À l'arrêt, la nouvelle durée s'applique tout de suite.
  if (!state.running) next.remainingSecAtPause = phaseDurationSec(next, next.currentPhase);
  return next;
}

export function formatMMSS(totalSec: number): string {
  const s = Math.max(0, Math.ceil(totalSec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function formatHM(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h} h ${String(m).padStart(2, "0")}` : `${m} min`;
}
