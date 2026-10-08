import { cn } from "@/lib/utils";
import { PHASE_THEME } from "./phaseTheme";
import type { Phase } from "./state";
import { formatHM } from "./timer";

type PostureStatsProps = { sitSec: number; standSec: number };

/** Totaux du jour assis / debout, avec la part de temps debout. */
export function PostureStats({ sitSec, standSec }: PostureStatsProps) {
  const total = sitSec + standSec;
  const standPct = total > 0 ? Math.round((standSec / total) * 100) : 0;
  return (
    <div className="flex w-full max-w-72 shrink-0 flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-[0.8148rem] font-bold tracking-[.06em] text-muted uppercase">Aujourd'hui</span>
        <span className="text-[0.8889rem] font-semibold text-muted tabular-nums">{standPct} % debout</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <StatTile phase="sit" seconds={sitSec} />
        <StatTile phase="stand" seconds={standSec} />
      </div>
      <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-default" aria-hidden>
        {total > 0 && (
          <>
            <span className={cn("rounded-full", PHASE_THEME.sit.dot)} style={{ width: `${100 - standPct}%` }} />
            <span className={cn("rounded-full", PHASE_THEME.stand.dot)} style={{ width: `${standPct}%` }} />
          </>
        )}
      </div>
    </div>
  );
}

function StatTile({ phase, seconds }: { phase: Phase; seconds: number }) {
  const theme = PHASE_THEME[phase];
  return (
    <div className="rounded-[10px] bg-surface-secondary px-2.5 py-2">
      <div className="flex items-center gap-1.5 text-[0.8889rem] text-muted">
        <span aria-hidden className={cn("size-2 rounded-full", theme.dot)} />
        {theme.label}
      </div>
      <div className="mt-0.5 text-[1.1852rem] font-bold tracking-[-0.01em] tabular-nums">{formatHM(seconds)}</div>
    </div>
  );
}
