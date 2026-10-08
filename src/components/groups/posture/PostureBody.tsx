import { useEffect, useRef, useState } from "react";
import { fireAlarmNotification } from "@/lib/alarm";
import { notify } from "@/lib/notify";
import type { BodyProps } from "../types";
import { PhaseBadge } from "./PhaseBadge";
import { PostureControls } from "./PostureControls";
import { PostureSettings } from "./PostureSettings";
import { PostureStats } from "./PostureStats";
import { ProgressRing } from "./ProgressRing";
import type { Phase, PostureState } from "./state";
import {
  completePhase,
  liveTotals,
  pause,
  phaseDurationSec,
  remainingSec,
  restartPhase,
  start,
  stop,
  switchPhase,
  updateConfig,
} from "./timer";

const TICK_MS = 500;

function announce(phase: Phase, sound: boolean) {
  const title = phase === "stand" ? "Lève-toi ! 🧍" : "Assieds-toi 🪑";
  const body = phase === "stand" ? "C'est l'heure de la pause debout." : "Reprends une position assise.";
  notify({ title, body, kind: "alarm", durationMs: 8000 });
  void fireAlarmNotification(title, body, { sound });
}

/** Minuteur assis / debout : alternance des phases, rappels et totaux du jour. */
export function PostureBody({ value, onChange }: BodyProps<PostureState>) {
  const [now, setNow] = useState(() => Date.now());
  const valueRef = useRef(value);
  valueRef.current = value;
  /** `phaseEndAt` déjà traité, pour ne pas sonner deux fois avant le re-rendu du parent. */
  const handledEndRef = useRef<number | null>(null);

  useEffect(() => {
    if (!value.running) return;
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      const s = valueRef.current;
      if (s.running && s.phaseEndAt !== null && t >= s.phaseEndAt && handledEndRef.current !== s.phaseEndAt) {
        handledEndRef.current = s.phaseEndAt;
        const next = completePhase(s, t);
        onChange(next);
        announce(next.currentPhase, s.soundEnabled);
      }
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [value.running, onChange]);

  const apply = (fn: (s: PostureState, t: number) => PostureState) => {
    const t = Date.now();
    setNow(t);
    onChange(fn(valueRef.current, t));
  };

  const remaining = remainingSec(value, now);
  const total = phaseDurationSec(value, value.currentPhase);
  const progress = Math.min(100, Math.max(0, ((total - remaining) / total) * 100));
  const totals = liveTotals(value, now);

  return (
    <div className="flex h-full min-h-0 flex-col items-center gap-3 pt-1">
      <PhaseBadge phase={value.currentPhase} running={value.running} />
      <ProgressRing phase={value.currentPhase} progress={progress} remainingSec={remaining} running={value.running} />
      <PostureControls
        phase={value.currentPhase}
        running={value.running}
        onSwitch={() => apply(switchPhase)}
        onMove={() => apply(restartPhase)}
        onStop={() => apply(stop)}
        onToggleRun={() => apply(value.running ? pause : start)}
      />
      <PostureStats sitSec={totals.sit} standSec={totals.stand} />
      <div className="flex w-full shrink-0 justify-center border-t border-separator pt-2">
        <PostureSettings
          sitMin={value.sitMin}
          standMin={value.standMin}
          soundEnabled={value.soundEnabled}
          onChange={(patch) => apply((s) => updateConfig(s, patch))}
        />
      </div>
    </div>
  );
}
