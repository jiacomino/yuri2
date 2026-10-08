import { cn } from "@/lib/utils";
import { APP_COLORS } from "./meta";

type ColorDotsProps = { value: string; onChange: (color: string) => void };

/** Palette de pastilles pour la teinte propre d'une tâche. */
export function ColorDots({ value, onChange }: ColorDotsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {APP_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={`Couleur ${c}`}
          aria-pressed={value === c}
          onClick={() => onChange(c)}
          className={cn(
            "size-5 rounded-full transition-all",
            value === c ? "ring-2 ring-offset-2 ring-offset-surface" : "opacity-70 hover:opacity-100",
          )}
          style={{ backgroundColor: c, ["--tw-ring-color" as string]: c }}
        />
      ))}
    </div>
  );
}
