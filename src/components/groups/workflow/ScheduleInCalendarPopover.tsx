import { useState } from "react";
import { Button, Checkbox, Label, ListBox, Popover, Select } from "@heroui/react";
import { CalendarPlus } from "lucide-react";
import { toDatetimeLocal } from "@/lib/alarm";
import { cn } from "@/lib/utils";
import type { CalendarTarget } from "./calendar";
import type { WorkflowAction } from "./state";
import { nativeFieldClass } from "./ui";

const DURATIONS = [30, 60, 120];

type ScheduleInCalendarPopoverProps = {
  action: WorkflowAction;
  calendars: CalendarTarget[];
  onSchedule: (action: WorkflowAction, calendarId: string, start: string, durationMin: number, allDay: boolean) => void;
};

/**
 * Copie l'action dans un groupe Calendrier, sous forme de tâche.
 * Isolé et masqué par le parent tant qu'aucun calendrier n'est branché.
 */
export function ScheduleInCalendarPopover({ action, calendars, onSchedule }: ScheduleInCalendarPopoverProps) {
  const [open, setOpen] = useState(false);
  const [when, setWhen] = useState("");
  const [duration, setDuration] = useState(60);
  const [allDay, setAllDay] = useState(false);
  const [calendarId, setCalendarId] = useState("");

  function handleOpenChange(next: boolean) {
    if (next) {
      // Pré-rempli depuis l'échéance, sinon l'alarme, sinon vide (= pas de planification).
      setWhen(action.due ? `${action.due}T09:00` : toDatetimeLocal(action.alarmAt));
      setCalendarId(calendars[0]?.id ?? "");
      setAllDay(false);
    }
    setOpen(next);
  }

  function submit() {
    if (!when || !calendarId) return;
    onSchedule(action, calendarId, allDay ? `${when.slice(0, 10)}T00:00` : when, duration, allDay);
    setOpen(false);
  }

  return (
    <Popover isOpen={open} onOpenChange={handleOpenChange}>
      <Button size="sm" variant="outline">
        <CalendarPlus className="size-3.5" />
        Calendrier
      </Button>
      <Popover.Content placement="bottom start">
        <Popover.Dialog className="flex w-72 flex-col gap-2 p-3">
          <span className="text-xs font-medium text-muted">Ajouter au calendrier</span>
          {calendars.length > 1 && (
            <Select
              aria-label="Calendrier cible"
              value={calendarId}
              onChange={(key) => setCalendarId(key == null ? "" : String(key))}
            >
              <Select.Trigger className="h-8 text-xs">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {calendars.map((c) => (
                    <ListBox.Item key={c.id} id={c.id} textValue={c.name}>
                      {c.name}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          )}
          <input
            type={allDay ? "date" : "datetime-local"}
            value={allDay ? when.slice(0, 10) : when}
            onChange={(e) => setWhen(e.currentTarget.value)}
            aria-label="Date"
            className={nativeFieldClass}
          />
          <Checkbox isSelected={allDay} onChange={setAllDay}>
            <Checkbox.Content>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Label className="text-xs">Journée entière</Label>
            </Checkbox.Content>
          </Checkbox>
          {!allDay && (
            <div className="flex items-center gap-1">
              {DURATIONS.map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => setDuration(min)}
                  aria-pressed={duration === min}
                  className={cn(
                    "cursor-pointer rounded-full px-2.5 py-0.5 text-xs transition-colors",
                    duration === min
                      ? "bg-accent/10 font-medium text-foreground ring-1 ring-accent/30"
                      : "text-muted hover:bg-surface-secondary",
                  )}
                >
                  {min < 60 ? `${min} min` : `${min / 60} h`}
                </button>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-1.5">
            <Button size="sm" variant="secondary" onPress={() => setOpen(false)}>
              Annuler
            </Button>
            {/* Pas de date, pas de planification. */}
            <Button size="sm" variant="primary" isDisabled={!when || !calendarId} onPress={submit}>
              Ajouter
            </Button>
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
