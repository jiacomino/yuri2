import { cn } from "@/lib/utils";
import { PRIORITY_META, PRIORITY_ORDER } from "./meta";
import type { CardPriority } from "./state";

type PriorityPickerProps = {
  value: CardPriority;
  onChange: (priority: CardPriority) => void;
};

/** Rangée de pastilles pour choisir la priorité d'une carte. */
export function PriorityPicker({ value, onChange }: PriorityPickerProps) {
  return (
    <div role="radiogroup" aria-label="Priorité" className="flex flex-wrap items-center gap-1.5">
      {PRIORITY_ORDER.map((p) => {
        const meta = PRIORITY_META[p];
        const active = value === p;
        return (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(p)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-all",
              meta.chip,
              active ? "ring-2 ring-accent/50" : "opacity-60 hover:opacity-100",
            )}
          >
            <span className={cn("size-1.5 rounded-full", meta.dot)} />
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}
