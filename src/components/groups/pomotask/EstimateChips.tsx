import { cn } from "@/lib/utils";
import { ESTIMATES } from "./state";

type EstimateChipsProps = {
  value: number;
  onChange: (minutes: number) => void;
  isDisabled?: boolean;
  className?: string;
};

/**
 * Rangée de pastilles d'estimation (minutes). Le `mousedown` est neutralisé pour ne
 * pas faire perdre le focus à un champ en cours d'édition (qui validerait au blur).
 */
export function EstimateChips({ value, onChange, isDisabled, className }: EstimateChipsProps) {
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-1", className)}>
      {ESTIMATES.map((m) => {
        const selected = value === m;
        return (
          <button
            key={m}
            type="button"
            disabled={isDisabled}
            aria-pressed={selected}
            title={`${m} min`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              onChange(m);
            }}
            className={cn(
              "h-6 min-w-8 cursor-pointer rounded-md px-2 text-[0.8148rem] font-bold tabular-nums transition-colors",
              selected
                ? "bg-rose-500 text-white dark:bg-rose-500/80"
                : "bg-default text-muted hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-500/15 dark:hover:text-rose-300",
              isDisabled && "cursor-not-allowed opacity-50",
            )}
          >
            {m}
          </button>
        );
      })}
    </div>
  );
}
