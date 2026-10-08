import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIORITY_META, PRIORITY_ORDER } from "./meta";
import type { Priority } from "./state";

type PriorityPickerProps = { value: Priority; onChange: (p: Priority) => void };

/** Quatre niveaux d'urgence sous forme de pastilles. */
export function PriorityPicker({ value, onChange }: PriorityPickerProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PRIORITY_ORDER.map((p) => {
        const active = value === p;
        return (
          <button
            key={p}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(p)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-all",
              active
                ? "bg-surface text-foreground shadow-[0_1px_4px_rgba(15,23,42,.08)] ring-1 ring-border"
                : "text-muted hover:bg-surface",
            )}
          >
            <Flag className={cn("size-3", PRIORITY_META[p].text)} />
            {PRIORITY_META[p].label}
          </button>
        );
      })}
    </div>
  );
}
