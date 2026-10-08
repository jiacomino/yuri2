import { cn } from "@/lib/utils";
import { PHASE_THEME } from "./phaseTheme";
import type { Phase } from "./state";

type PhaseBadgeProps = { phase: Phase; running: boolean };

/** Pastille de la phase courante, avec un point qui pulse quand le minuteur tourne. */
export function PhaseBadge({ phase, running }: PhaseBadgeProps) {
  const theme = PHASE_THEME[phase];
  const Icon = theme.icon;
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.8148rem] font-bold tracking-[.06em] uppercase",
        theme.pill,
      )}
    >
      <Icon className="size-3.5" />
      <span>{theme.label}</span>
      <span aria-hidden className={cn("size-1.5 rounded-full bg-current", running ? "animate-pulse" : "opacity-30")} />
    </div>
  );
}
