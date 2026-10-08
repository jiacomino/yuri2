import { findDefinition } from "@/components/groups/registry";
import { cn } from "@/lib/utils";
import type { GroupRecord } from "@/types/workspace";

type MinimizedDockProps = {
  groups: GroupRecord[];
  onRestore: (id: string) => void;
  /** Résultat du filtre (Ctrl+F) : ids correspondants, ou null sans filtre actif. */
  matchIds?: Set<string> | null;
};

/** Composants réduits de l'espace actif, en pastilles en bas à droite. */
export function MinimizedDock({ groups, onRestore, matchIds }: MinimizedDockProps) {
  if (groups.length === 0) return null;
  return (
    <div className="pointer-events-none fixed right-6 bottom-6 z-20 flex max-w-[60vw] flex-wrap justify-end gap-2">
      {groups.map((g) => {
        const def = findDefinition(g.kind);
        const Icon = def?.icon;
        const color = g.color ?? def?.color ?? "#64748b";
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => onRestore(g.id)}
            title="Restaurer"
            className={cn(
              "pointer-events-auto flex cursor-pointer items-center gap-2 rounded-xl bg-surface py-1.5 pr-3.5 pl-1.5 text-[0.963rem] font-semibold shadow-[0_1px_2px_rgba(16,24,40,.06),0_6px_20px_rgba(16,24,40,.10)] transition-[transform,opacity] hover:-translate-y-0.5",
              matchIds && (matchIds.has(g.id) ? "outline-2 outline-offset-2 outline-accent" : "opacity-30"),
            )}
          >
            <span
              className="grid size-[26px] place-items-center rounded-[8px]"
              style={{
                background: `color-mix(in oklab, ${color} 16%, transparent)`,
                color: `color-mix(in oklab, ${color} 80%, var(--foreground))`,
              }}
            >
              {Icon && <Icon className="size-3.5" />}
            </span>
            <span className="max-w-40 truncate">{g.name}</span>
          </button>
        );
      })}
    </div>
  );
}
