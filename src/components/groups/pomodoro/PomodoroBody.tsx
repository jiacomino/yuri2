import type { BodyProps } from "../types";
import { cn } from "@/lib/utils";
import { announceTimerEnd, warmUpNotifications } from "./announce";
import { PHASE_META } from "./phases";
import { PomodoroControls } from "./PomodoroControls";
import { PomodoroSettings } from "./PomodoroSettings";
import { SessionDots } from "./SessionDots";
import { nextPhase, phaseDurationMs, type PomodoroConfig, type PomodoroState } from "./state";
import { formatClock, idleTimer, pauseTimer, runningTimer, startTimer } from "./timer";
import { TimerRing } from "./TimerRing";
import { usePomodoroTimer } from "./usePomodoroTimer";

export function PomodoroBody({ value, onChange }: BodyProps<PomodoroState>) {
  const { config, phase, completed, timer } = value;
  const totalMs = phaseDurationMs(phase, config);
  const meta = PHASE_META[phase];

  function advance(autoStart: boolean): PomodoroState {
    const next = nextPhase(phase, completed, config);
    return {
      ...value,
      phase: next,
      completed: phase === "work" ? completed + 1 : completed,
      timer: autoStart ? runningTimer(phaseDurationMs(next, config)) : idleTimer(),
    };
  }

  const view = usePomodoroTimer(timer, totalMs, () => {
    announceTimerEnd({ title: meta.endTitle, body: meta.endBody, sound: config.sound });
    onChange(advance(config.autoStart));
  });

  function start() {
    warmUpNotifications();
    onChange({ ...value, timer: startTimer(timer, totalMs) });
  }

  function updateConfig(patch: Partial<PomodoroConfig>) {
    // Hors marche, la phase courante repart sur sa nouvelle durée.
    onChange({ ...value, config: { ...config, ...patch }, timer: view.isRunning ? timer : idleTimer() });
  }

  function resetAll() {
    onChange({ ...value, phase: "work", completed: 0, timer: idleTimer() });
  }

  const perCycle = config.sessionsBeforeLong;
  const doneInCycle = phase !== "work" && completed > 0 && completed % perCycle === 0 ? perCycle : completed % perCycle;
  const session = Math.max(1, Math.min(doneInCycle + (phase === "work" ? 1 : 0), perCycle));

  return (
    <div className="flex h-full min-h-0 flex-col items-center pt-1">
      {/* Pastille, anneau et commandes groupés au centre de la hauteur libre. */}
      <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-4">
        <span
          className={cn("rounded-full px-2.5 py-1 text-[0.8148rem] font-bold tracking-[.06em] uppercase", meta.pill)}
        >
          {meta.label}
        </span>

        <TimerRing
          fluid
          progress={view.progress}
          size={220}
          stroke={13}
          fillClass={meta.fill}
          trackClass={meta.track}
          animate={view.isRunning}
        >
          <span className="text-[length:clamp(26px,22cqw,52px)] leading-none font-extrabold tracking-[-0.03em] tabular-nums">
            {formatClock(view.remainingMs)}
          </span>
          <span className="mt-1 text-[0.8889rem] text-muted tabular-nums">sur {formatClock(totalMs)}</span>
        </TimerRing>

        <PomodoroControls
          isRunning={view.isRunning}
          isStarted={view.isStarted}
          onStart={start}
          onPause={() => onChange({ ...value, timer: pauseTimer(timer) })}
          onReset={() => onChange({ ...value, timer: idleTimer() })}
          onSkip={() => onChange(advance(false))}
          extra={<PomodoroSettings config={config} onChange={updateConfig} />}
        />
      </div>

      <div className="mt-3 flex w-full shrink-0 flex-col gap-2 border-t border-separator pt-3">
        <div className="flex items-center justify-between text-[0.8889rem]">
          <span className="text-muted">Session</span>
          <span className="font-bold tabular-nums">
            {session} / {perCycle}
          </span>
        </div>
        <SessionDots total={perCycle} done={doneInCycle} working={phase === "work"} />
        <div className="flex items-center justify-between text-[0.8889rem] text-muted">
          <span className="tabular-nums">
            {completed} session{completed > 1 ? "s" : ""} terminée{completed > 1 ? "s" : ""}
          </span>
          {completed > 0 && (
            <button
              type="button"
              onClick={resetAll}
              className="cursor-pointer font-semibold hover:text-foreground"
            >
              tout réinitialiser
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
