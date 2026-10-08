import { useState } from "react";
import { Label, NumberField, Switch } from "@heroui/react";
import { ChevronDown, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PHASE_THEME } from "./phaseTheme";
import type { Phase } from "./state";
import { MAX_PHASE_MIN, MIN_PHASE_MIN } from "./timer";

type PostureSettingsProps = {
  sitMin: number;
  standMin: number;
  soundEnabled: boolean;
  onChange: (patch: { sitMin?: number; standMin?: number; soundEnabled?: boolean }) => void;
};

/** Réglages repliables : durées des deux phases et carillon. */
export function PostureSettings({ sitMin, standMin, soundEnabled, onChange }: PostureSettingsProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-full max-w-72">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-[0.8889rem] font-semibold text-muted hover:bg-surface-secondary hover:text-foreground"
      >
        <Settings2 className="size-3.5" />
        <span className="tabular-nums">
          {sitMin} min assis · {standMin} min debout
        </span>
        <ChevronDown className={cn("ml-auto size-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-1 flex flex-col gap-2 rounded-xl bg-surface-secondary p-2.5">
          <DurationField phase="sit" value={sitMin} onChange={(v) => onChange({ sitMin: v })} />
          <DurationField phase="stand" value={standMin} onChange={(v) => onChange({ standMin: v })} />
          <Switch size="sm" isSelected={soundEnabled} onChange={(v) => onChange({ soundEnabled: v })}>
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              <Label className="text-xs">Son à la fin de chaque phase</Label>
            </Switch.Content>
          </Switch>
        </div>
      )}
    </div>
  );
}

function DurationField({ phase, value, onChange }: { phase: Phase; value: number; onChange: (v: number) => void }) {
  const theme = PHASE_THEME[phase];
  const Icon = theme.icon;
  return (
    <div className="flex items-center justify-between gap-2">
      <span className={cn("flex items-center gap-1.5 text-[0.8889rem] font-semibold", theme.text)}>
        <Icon className="size-3.5" />
        {theme.label}
      </span>
      <div className="flex items-center gap-1.5">
        <NumberField
          aria-label={`Durée ${theme.label.toLowerCase()} en minutes`}
          value={value}
          minValue={MIN_PHASE_MIN}
          maxValue={MAX_PHASE_MIN}
          onChange={(v) => {
            if (Number.isFinite(v)) onChange(Math.round(v));
          }}
          className="w-28"
        >
          <NumberField.Group>
            <NumberField.DecrementButton />
            <NumberField.Input className="text-center tabular-nums" />
            <NumberField.IncrementButton />
          </NumberField.Group>
        </NumberField>
        <span className="text-xs text-muted">min</span>
      </div>
    </div>
  );
}
