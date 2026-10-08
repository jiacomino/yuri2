import { Button, Popover } from "@heroui/react";
import { Settings2 } from "lucide-react";
import { MinutesField } from "./MinutesField";
import { SettingToggle } from "./SettingToggle";
import { MINUTES_RANGE, SESSIONS_RANGE, type PomodoroConfig } from "./state";

type PomodoroSettingsProps = {
  config: PomodoroConfig;
  onChange: (patch: Partial<PomodoroConfig>) => void;
};

/** Bouton « Réglages » + popover : durées, cycle, enchaînement et son. */
export function PomodoroSettings({ config, onChange }: PomodoroSettingsProps) {
  return (
    <Popover>
      <Button
        isIconOnly
        variant="outline"
        className="size-10 rounded-xl border-border bg-surface text-foreground/80 hover:bg-surface-secondary"
        aria-label="Réglages"
      >
        <span title="Réglages">
          <Settings2 className="size-4" />
        </span>
      </Button>
      <Popover.Content placement="bottom">
        <Popover.Dialog className="flex w-72 flex-col gap-3 p-3">
          <span className="text-[0.8148rem] font-bold tracking-[.06em] text-muted uppercase">Réglages du pomodoro</span>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
            <MinutesField
              label="Travail (min)"
              value={config.workMin}
              {...MINUTES_RANGE}
              onChange={(workMin) => onChange({ workMin })}
            />
            <MinutesField
              label="Pause courte (min)"
              value={config.shortBreakMin}
              {...MINUTES_RANGE}
              onChange={(shortBreakMin) => onChange({ shortBreakMin })}
            />
            <MinutesField
              label="Pause longue (min)"
              value={config.longBreakMin}
              {...MINUTES_RANGE}
              onChange={(longBreakMin) => onChange({ longBreakMin })}
            />
            <MinutesField
              label="Sessions / cycle"
              value={config.sessionsBeforeLong}
              {...SESSIONS_RANGE}
              onChange={(sessionsBeforeLong) => onChange({ sessionsBeforeLong })}
            />
          </div>
          <div className="flex flex-col gap-2 rounded-xl bg-surface-secondary p-2.5">
            <SettingToggle
              label="Enchaîner automatiquement les phases"
              isSelected={config.autoStart}
              onChange={(autoStart) => onChange({ autoStart })}
            />
            <SettingToggle
              label="Son à la fin d'une phase"
              isSelected={config.sound}
              onChange={(sound) => onChange({ sound })}
            />
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
