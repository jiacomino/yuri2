import { useEffect, useRef, useState } from "react";
import { remainingOf, type TimerState } from "./timer";

const TICK_MS = 250;

export type PomodoroTimerView = {
  remainingMs: number;
  isRunning: boolean;
  /** 0 → 1 */
  progress: number;
  /** Vrai si le minuteur a déjà été entamé (affiche « Reprendre »). */
  isStarted: boolean;
};

/**
 * Fait « battre » l'affichage d'un `TimerState` et appelle `onElapsed` une seule fois
 * quand l'heure de fin est atteinte. Le hook ne modifie rien : c'est l'appelant qui
 * produit le nouvel état (phase suivante, notification…).
 */
export function usePomodoroTimer(
  timer: TimerState,
  totalMs: number,
  onElapsed: () => void,
): PomodoroTimerView {
  const [tick, setTick] = useState(0);
  const isRunning = timer.endAt !== null;

  const onElapsedRef = useRef(onElapsed);
  useEffect(() => {
    onElapsedRef.current = onElapsed;
  });

  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => setTick((n) => n + 1), TICK_MS);
    return () => window.clearInterval(id);
  }, [isRunning]);

  // Garde contre un double déclenchement pour la même échéance.
  const handledRef = useRef<number | null>(null);
  useEffect(() => {
    const endAt = timer.endAt;
    if (endAt === null || Date.now() < endAt) return;
    if (handledRef.current === endAt) return;
    handledRef.current = endAt;
    onElapsedRef.current();
  }, [tick, timer.endAt]);

  const remainingMs = remainingOf(timer, totalMs);
  const progress = totalMs > 0 ? Math.min(1, Math.max(0, 1 - remainingMs / totalMs)) : 0;
  return {
    remainingMs,
    isRunning,
    progress,
    isStarted: isRunning || (timer.remainingMs !== null && timer.remainingMs < totalMs),
  };
}
