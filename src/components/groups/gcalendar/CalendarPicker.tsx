import { Button, Checkbox, Label, Popover } from "@heroui/react";
import { CalendarDays } from "lucide-react";
import type { Calendar } from "@/lib/google";
import { cn } from "@/lib/utils";

type CalendarPickerProps = {
  calendars: Calendar[];
  selectedIds: string[];
  onToggle: (id: string) => void;
};

/** Popover de choix des calendriers affichés. */
export function CalendarPicker({ calendars, selectedIds, onToggle }: CalendarPickerProps) {
  return (
    <Popover>
      <Button isIconOnly size="sm" variant="ghost" aria-label="Choisir les calendriers à afficher" className="text-muted">
        <CalendarDays className="size-4" />
      </Button>
      <Popover.Content placement="top end">
        <Popover.Dialog className="flex max-h-72 min-w-56 max-w-80 flex-col gap-1 overflow-y-auto p-2">
          <p className="px-1.5 pb-1 text-[0.8148rem] font-bold tracking-[.06em] text-muted uppercase">Calendriers</p>
          {calendars.length === 0 ? (
            <p className="px-1.5 py-2 text-[0.8889rem] text-muted">Aucun calendrier chargé. Rafraîchissez pour recharger.</p>
          ) : (
            calendars.map((c) => (
              <Checkbox
                key={c.id}
                isSelected={selectedIds.includes(c.id)}
                onChange={() => onToggle(c.id)}
                className="rounded-[10px] px-1.5 py-1.5 hover:bg-surface-secondary"
              >
                <Checkbox.Content className="flex w-full items-center gap-2">
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ backgroundColor: c.backgroundColor }} />
                  <Label className={cn("flex-1 truncate text-[0.9259rem]", c.primary && "font-semibold")}>{c.summary}</Label>
                </Checkbox.Content>
              </Checkbox>
            ))
          )}
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
