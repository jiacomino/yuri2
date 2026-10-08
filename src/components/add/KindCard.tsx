import { groupDescriptions } from "@/components/groups/registry";
import type { GroupDefinition } from "@/components/groups/types";
import { cn } from "@/lib/utils";

type KindCardProps = {
  def: GroupDefinition<unknown>;
  selected: boolean;
  onSelect: () => void;
  /** Double-clic : création immédiate. */
  onConfirm: () => void;
};

/** Carte d'un type de composant dans la fenêtre « Ajouter un composant ». */
export function KindCard({ def, selected, onSelect, onConfirm }: KindCardProps) {
  const Icon = def.icon;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      onDoubleClick={onConfirm}
      className={cn(
        "flex cursor-pointer flex-col items-start gap-2 rounded-xl bg-surface p-3 text-left transition-all",
        "shadow-[0_1px_2px_rgba(16,24,40,.08)] hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(16,24,40,.10)]",
        selected ? "ring-2 ring-accent" : "ring-1 ring-border",
      )}
    >
      <span
        className="grid size-[30px] place-items-center rounded-[9px]"
        style={{
          background: `color-mix(in oklab, ${def.color} 16%, transparent)`,
          color: `color-mix(in oklab, ${def.color} 80%, var(--foreground))`,
        }}
      >
        <Icon className="size-4" />
      </span>
      <span className="text-[0.963rem] font-bold leading-tight tracking-[-0.01em]">{def.label}</span>
      <span className="text-[0.8889rem] leading-snug text-muted">{groupDescriptions[def.kind]}</span>
    </button>
  );
}
