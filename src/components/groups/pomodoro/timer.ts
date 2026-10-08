/**
 * Minuteur sérialisable partagé par « Pomodoro » et « Pomo-tâches ».
 * On ne stocke jamais un compteur qui décrémente : soit l'heure de fin (`endAt`, timer
 * en marche), soit le temps restant figé (`remainingMs`, timer en pause). Le décompte
 * survit ainsi aux re-rendus, aux remontages et à un futur rechargement depuis SQLite.
 */
export type TimerState = {
  /** Horodatage (ms epoch) de fin quand le minuteur tourne, sinon `null`. */
  endAt: number | null;
  /** Temps restant figé en pause ; `null` = durée complète (jamais démarré / réinitialisé). */
  remainingMs: number | null;
};

export const idleTimer = (): TimerState => ({ endAt: null, remainingMs: null });

export function remainingOf(timer: TimerState, totalMs: number, now = Date.now()): number {
  if (timer.endAt !== null) return Math.max(0, timer.endAt - now);
  return timer.remainingMs ?? totalMs;
}

export function startTimer(timer: TimerState, totalMs: number, now = Date.now()): TimerState {
  if (timer.endAt !== null) return timer;
  const rem = timer.remainingMs !== null && timer.remainingMs > 0 ? timer.remainingMs : totalMs;
  return { endAt: now + rem, remainingMs: null };
}

export function pauseTimer(timer: TimerState, now = Date.now()): TimerState {
  if (timer.endAt === null) return timer;
  return { endAt: null, remainingMs: Math.max(0, timer.endAt - now) };
}

/** Lance directement un minuteur plein (enchaînement automatique des phases). */
export function runningTimer(totalMs: number, now = Date.now()): TimerState {
  return { endAt: now + totalMs, remainingMs: null };
}

/** `mm:ss` arrondi à la seconde supérieure. */
export function formatClock(ms: number): string {
  const safe = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
