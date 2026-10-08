import { cn } from "@/lib/utils";
import { PomodoroControls } from "../pomodoro/PomodoroControls";
import { formatClock } from "../pomodoro/timer";
import { TimerRing } from "../pomodoro/TimerRing";
import type { PomodoroTimerView } from "../pomodoro/usePomodoroTimer";
import { EstimateChips } from "./EstimateChips";
import type { PomoTask } from "./state";

type ActiveTaskTimerProps = {
  task: PomoTask | undefined;
  view: PomodoroTimerView;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onChangeEstimate: (minutes: number) => void;
};

/** Haut du composant : tâche active, estimation, anneau et commandes. */
export function ActiveTaskTimer({ task, view, onStart, onPause, onReset, onChangeEstimate }: ActiveTaskTimerProps) {
  // Pastille d'état au-dessus du minuteur (purement visuelle).
  const phase = view.isRunning
    ? { label: "Concentration", className: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" }
    : view.isStarted
      ? { label: "En pause", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" }
      : { label: "Prêt", className: "bg-default text-muted" };

  return (
    <div className="flex shrink-0 flex-col items-center gap-2.5 pt-1">
      {task && (
        <span
          className={cn("rounded-full px-2.5 py-1 text-[0.8148rem] font-bold tracking-[.06em] uppercase", phase.className)}
        >
          {phase.label}
        </span>
      )}

      <div
        title={task?.text}
        className={cn(
          "max-w-full truncate px-2 text-center",
          task ? "text-[1.037rem] font-semibold" : "text-[0.8889rem] text-muted",
        )}
      >
        {task ? task.text : "Aucune tâche sélectionnée"}
      </div>

      {task && <EstimateChips value={task.estimateMin} onChange={onChangeEstimate} isDisabled={view.isRunning} />}

      <TimerRing
        progress={view.progress}
        size={150}
        stroke={10}
        fillClass="stroke-rose-500"
        trackClass="stroke-default"
        animate={view.isRunning}
      >
        <span
          className={cn("text-[38px] leading-none font-extrabold tracking-[-0.03em] tabular-nums", !task && "text-muted")}
        >
          {formatClock(view.remainingMs)}
        </span>
        {task && <span className="text-[0.8889rem] text-muted tabular-nums">sur {task.estimateMin} min</span>}
      </TimerRing>

      <PomodoroControls
        isRunning={view.isRunning}
        isStarted={view.isStarted}
        isDisabled={!task}
        onStart={onStart}
        onPause={onPause}
        onReset={onReset}
      />
    </div>
  );
}
