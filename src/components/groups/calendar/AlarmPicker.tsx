import { Bell, BellOff } from "lucide-react";
import { requestNotificationPermission } from "@/lib/alarm";
import { cn } from "@/lib/utils";
import { ALARM_PRESETS, alarmInstant, formatAlarmWhen } from "./alarms";
import type { CalendarTask } from "./state";

type AlarmPickerProps = {
  task: CalendarTask;
  /** `undefined` retire l'alerte. */
  onChange: (minutesBefore: number | undefined) => void;
};

/** Délai de l'alerte avant le début de la tâche, sous forme de pastilles. */
export function AlarmPicker({ task, onChange }: AlarmPickerProps) {
  const value = task.alarmMinutesBefore;
  const at = alarmInstant(task);
  const options: { minutes: number | undefined; label: string }[] = [
    { minutes: undefined, label: "Aucune" },
    ...ALARM_PRESETS,
  ];

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = value === o.minutes;
          const Icon = o.minutes === undefined ? BellOff : Bell;
          return (
            <button
              key={o.label}
              type="button"
              aria-pressed={active}
              onClick={() => {
                onChange(o.minutes);
                if (o.minutes !== undefined) void requestNotificationPermission();
              }}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-all",
                active
                  ? "bg-surface text-foreground shadow-[0_1px_4px_rgba(15,23,42,.08)] ring-1 ring-border"
                  : "text-muted hover:bg-surface",
              )}
            >
              <Icon className={cn("size-3", active && o.minutes !== undefined && "text-warning")} />
              {o.label}
            </button>
          );
        })}
      </div>
      {at && (
        <span className="text-xs text-muted tabular-nums">
          {task.alarmFiredAt === at ? "Rappel affiché" : "Rappel"} le {formatAlarmWhen(at)}
          {new Date(at).getTime() < Date.now() && task.alarmFiredAt !== at && " (imminent)"}
        </span>
      )}
    </div>
  );
}
