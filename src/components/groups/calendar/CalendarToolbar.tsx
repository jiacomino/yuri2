import { Button, ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { VIEWS } from "./meta";
import type { CalendarView } from "./state";

type CalendarToolbarProps = {
  title: string;
  view: CalendarView;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (view: CalendarView) => void;
  onAdd: () => void;
};

const NAV = "size-7 min-w-7 rounded-lg text-muted hover:text-foreground";

/** Navigation entre périodes, choix de la vue et création rapide. */
export function CalendarToolbar({ title, view, onPrev, onNext, onToday, onViewChange, onAdd }: CalendarToolbarProps) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1.5 pb-2.5">
      <div className="flex items-center">
        <Button isIconOnly size="sm" variant="ghost" className={NAV} aria-label="Période précédente" onPress={onPrev}>
          <ChevronLeft className="size-4" />
        </Button>
        <Button isIconOnly size="sm" variant="ghost" className={NAV} aria-label="Période suivante" onPress={onNext}>
          <ChevronRight className="size-4" />
        </Button>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-7 rounded-full border-border px-3 text-[0.8889rem] font-semibold"
        onPress={onToday}
      >
        Aujourd'hui
      </Button>
      <span className="min-w-0 flex-1 truncate px-1 text-[1.037rem] font-bold tracking-[-0.01em] first-letter:uppercase">
        {title}
      </span>
      <ToggleButtonGroup
        aria-label="Vue du calendrier"
        size="sm"
        selectionMode="single"
        disallowEmptySelection
        className="cal-view-switch"
        selectedKeys={[view]}
        onSelectionChange={(keys) => {
          const next = [...keys][0];
          if (typeof next === "string") onViewChange(next as CalendarView);
        }}
      >
        {VIEWS.map((v) => (
          <ToggleButton key={v.id} id={v.id}>
            {v.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <Button
        isIconOnly
        size="sm"
        variant="primary"
        className="size-7 min-w-7 rounded-lg"
        aria-label="Nouvelle tâche"
        onPress={onAdd}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
