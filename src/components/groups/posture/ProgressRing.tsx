import { cn } from "@/lib/utils";
import { PHASE_THEME } from "./phaseTheme";
import type { Phase } from "./state";
import { formatMMSS } from "./timer";

type ProgressRingProps = {
  phase: Phase;
  /** Avancement de la phase, de 0 à 100. */
  progress: number;
  remainingSec: number;
  running: boolean;
};

/**
 * Anneau de progression avec le compte à rebours au centre. Il prend le plus grand carré
 * disponible (zone flex-1 du parent), jusqu'à 200 px.
 */
export function ProgressRing({ phase, progress, remainingSec, running }: ProgressRingProps) {
  const theme = PHASE_THEME[phase];
  return (
    <div className="flex min-h-28 w-full min-w-0 flex-1 items-center justify-center [container-type:size]">
      <div
        className="@container relative aspect-square max-w-[200px] shrink-0"
        style={{ width: "min(100cqw, 100cqh)" }}
      >
        <svg viewBox="0 0 100 100" className="block size-full -rotate-90">
          <circle cx="50" cy="50" r="43" fill="none" stroke="currentColor" strokeWidth="6" className={theme.ringTrack} />
          <circle
            cx="50"
            cy="50"
            r="43"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={100}
            strokeDashoffset={100 - progress}
            className={cn(theme.ringStroke, "transition-[stroke-dashoffset] duration-500")}
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[length:clamp(24px,21cqw,46px)] leading-none font-extrabold tracking-[-0.03em] tabular-nums">
            {formatMMSS(remainingSec)}
          </span>
          <span className="mt-1 text-[0.8889rem] text-muted">{running ? "restant" : "en pause"}</span>
        </div>
      </div>
    </div>
  );
}
