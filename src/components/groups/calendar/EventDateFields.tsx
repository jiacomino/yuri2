import { ArrowRight } from "lucide-react";
import { fromInput, toDateInput, toLocalInput } from "./dates";

type EventDateFieldsProps = {
  start: string;
  end: string;
  allDay: boolean;
  onChange: (patch: { start?: string; end?: string }) => void;
};

const fieldClass =
  "h-8 min-w-0 flex-1 rounded-xl border border-border bg-surface px-2 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

/** Début → fin, en date seule pour une journée entière, en date-heure sinon. */
export function EventDateFields({ start, end, allDay, onChange }: EventDateFieldsProps) {
  const type = allDay ? "date" : "datetime-local";
  const format = allDay ? toDateInput : toLocalInput;
  return (
    <div className="flex items-center gap-1.5">
      <input
        type={type}
        aria-label="Début"
        value={format(start)}
        onChange={(e) => {
          const iso = fromInput(e.currentTarget.value);
          if (iso) onChange({ start: iso });
        }}
        className={fieldClass}
      />
      <ArrowRight className="size-3.5 shrink-0 text-muted" aria-hidden />
      <input
        type={type}
        aria-label="Fin"
        value={format(end)}
        onChange={(e) => {
          const iso = fromInput(e.currentTarget.value);
          if (iso) onChange({ end: iso });
        }}
        className={fieldClass}
      />
    </div>
  );
}
