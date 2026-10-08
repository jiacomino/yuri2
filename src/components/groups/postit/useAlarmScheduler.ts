import { useEffect, useRef } from "react";

const TICK_MS = 15_000;

/**
 * Déclenche `onFire` une seule fois quand `alarmAt` est atteint (vérification immédiate
 * puis toutes les 15 s, robuste à la mise en veille). Inactif si l'alarme a déjà sonné.
 */
export function useAlarmScheduler(alarmAt: string | undefined, alarmFired: boolean, onFire: () => void) {
  // Toujours la dernière version du callback, sans relancer le minuteur.
  const onFireRef = useRef(onFire);
  onFireRef.current = onFire;

  useEffect(() => {
    if (!alarmAt || alarmFired) return;
    const target = new Date(alarmAt).getTime();
    if (Number.isNaN(target)) return;

    if (Date.now() >= target) {
      onFireRef.current();
      return;
    }
    const id = window.setInterval(() => {
      if (Date.now() >= target) {
        window.clearInterval(id);
        onFireRef.current();
      }
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [alarmAt, alarmFired]);
}
