import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Champs natifs (date, datetime, couleur) alignés sur les champs HeroUI. */
export const nativeFieldClass =
  "h-8 rounded-[10px] border border-border bg-surface px-2 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

/** Taille compacte pour les `Input` / `TextArea` HeroUI dans un groupe. */
export const compactInputClass = "h-8 px-2.5 py-1 text-xs sm:text-xs";

/** Fond teinté d'une pastille colorée (`color-mix` : lisible en clair comme en sombre). */
export function tintStyle(color: string, active = false): CSSProperties {
  return {
    color: `color-mix(in oklab, ${color} 80%, var(--foreground))`,
    backgroundColor: `color-mix(in oklab, ${color} ${active ? 26 : 14}%, transparent)`,
  };
}

export function Dot({ color, className }: { color: string; className?: string }) {
  return <span className={cn("size-2 shrink-0 rounded-full", className)} style={{ backgroundColor: color }} />;
}

/** Petit intitulé de zone (« Prochaines actions », « Critères de sortie »…). */
export function SectionLabel({ icon, children, className }: { icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-1.5 text-[0.8148rem] font-bold uppercase tracking-[.06em] text-muted", className)}>
      {icon}
      {children}
    </div>
  );
}

type ColorInputProps = {
  value: string;
  onChange: (color: string) => void;
  label: string;
};

/** Sélecteur de couleur natif, en pastille arrondie. */
export function ColorInput({ value, onChange, label }: ColorInputProps) {
  return (
    <input
      type="color"
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      aria-label={label}
      title={label}
      className="size-7 shrink-0 cursor-pointer rounded-[9px] border border-border bg-surface p-0.5"
    />
  );
}
