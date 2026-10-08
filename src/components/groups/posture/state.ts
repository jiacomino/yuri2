export type Phase = "sit" | "stand";

/**
 * Minuteur assis / debout. Le temps « en cours » n'est pas écrit à chaque seconde :
 * on mémorise le début du segment non comptabilisé (`segmentStartAt`) et on le crédite
 * aux totaux uniquement lors des transitions (pause, changement de phase, arrêt).
 */
export type PostureState = {
  /** Durée de la phase assise, en minutes. */
  sitMin: number;
  /** Durée de la phase debout, en minutes. */
  standMin: number;
  /** Carillon à la fin de chaque phase. */
  soundEnabled: boolean;

  running: boolean;
  currentPhase: Phase;
  /** En marche : instant (epoch ms) de fin de la phase courante. */
  phaseEndAt: number | null;
  /** En pause : secondes restantes figées. */
  remainingSecAtPause: number | null;
  /** En marche : début (epoch ms) du temps pas encore crédité aux totaux du jour. */
  segmentStartAt: number | null;

  /** Jour (AAAA-MM-JJ) auquel se rapportent les totaux ; remis à zéro à minuit. */
  statsDate: string;
  sitTotalSec: number;
  standTotalSec: number;
};

export function dayKey(at: number = Date.now()): string {
  const d = new Date(at);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function defaultPostureState(): PostureState {
  return {
    sitMin: 30,
    standMin: 15,
    soundEnabled: true,
    running: false,
    currentPhase: "sit",
    phaseEndAt: null,
    remainingSecAtPause: 30 * 60,
    segmentStartAt: null,
    statsDate: dayKey(),
    sitTotalSec: 0,
    standTotalSec: 0,
  };
}

/** Démo : debout depuis un moment, avec une journée déjà bien entamée. */
export function demoPostureState(): PostureState {
  return {
    ...defaultPostureState(),
    sitMin: 45,
    standMin: 15,
    currentPhase: "stand",
    remainingSecAtPause: 9 * 60 + 24,
    sitTotalSec: 3 * 3600 + 25 * 60,
    standTotalSec: 1 * 3600 + 10 * 60,
  };
}
