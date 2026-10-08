import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Palette commune aux espaces de travail et aux composants. */
export const PALETTE = [
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#64748b",
];

type ColorSwatchesProps = {
  value: string | null;
  onChange: (color: string | null) => void;
  /** Ajoute une pastille « aucune couleur » en tête. */
  allowNone?: boolean;
};

/** Rangée de pastilles de couleur cliquables. */
export function ColorSwatches({ value, onChange, allowNone = false }: ColorSwatchesProps) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Couleur">
      {allowNone && (
        <button
          type="button"
          role="radio"
          aria-checked={value === null}
          aria-label="Aucune couleur"
          onClick={() => onChange(null)}
          className={cn(
            "grid size-6 place-items-center rounded-full border border-dashed border-border text-muted",
            value === null && "ring-2 ring-accent ring-offset-2 ring-offset-surface",
          )}
        >
          <span className="h-px w-3.5 rotate-45 bg-current" />
        </button>
      )}
      {PALETTE.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={value === color}
          aria-label={color}
          onClick={() => onChange(color)}
          className={cn(
            "grid size-6 place-items-center rounded-full text-white transition-transform hover:scale-110",
            value === color && "ring-2 ring-accent ring-offset-2 ring-offset-surface",
          )}
          style={{ background: color }}
        >
          {value === color && <Check className="size-3" strokeWidth={3} />}
        </button>
      ))}
    </div>
  );
}
