import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Hash, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

type TagSidebarProps = {
  open: boolean;
  onToggle: () => void;
  tags: { tag: string; count: number }[];
  /** Nombre de composants de l'espace actif. */
  total: number;
  active: string | null;
  onChange: (tag: string | null) => void;
};

/**
 * Menu latéral des tags de l'espace actif. Une languette sur son bord droit l'ouvre et le
 * ferme (aussi Ctrl+B) ; fermé, elle reste au bord du canevas. Un seul tag actif à la fois ;
 * les composants qui ne le portent pas sont masqués du canevas.
 */
export function TagSidebar({ open, onToggle, tags, total, active, onChange }: TagSidebarProps) {
  const label = open ? "Fermer le menu des tags (Ctrl+B)" : "Ouvrir le menu des tags (Ctrl+B)";
  return (
    <div className="relative flex shrink-0">
      {open && (
        <aside
          aria-label="Tags"
          className="flex w-52 shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-border/70 bg-surface/60 p-3"
        >
          <h2 className="px-2 pt-1 pb-2 text-[0.7407rem] font-bold tracking-[0.08em] text-muted uppercase">Tags</h2>
          <SidebarItem
            icon={<Layers className="size-3.5" />}
            selected={active === null}
            count={total}
            onClick={() => onChange(null)}
          >
            Tous les composants
          </SidebarItem>
          {tags.length === 0 ? (
            <p className="px-2 pt-2 text-[0.8889rem] text-muted italic">Aucun tag défini.</p>
          ) : (
            tags.map(({ tag, count }) => (
              <SidebarItem
                key={tag}
                icon={<Hash className="size-3.5" />}
                selected={active === tag}
                count={count}
                title={`#${tag}`}
                onClick={() => onChange(active === tag ? null : tag)}
              >
                {tag}
              </SidebarItem>
            ))
          )}
        </aside>
      )}
      <button
        type="button"
        aria-label={label}
        title={label}
        aria-expanded={open}
        onClick={onToggle}
        className={cn(
          "absolute top-3 z-30 grid h-8 w-5 cursor-pointer place-items-center rounded-r-[8px] border border-l-0 border-border/70 bg-surface text-muted shadow-sm transition-colors hover:text-foreground",
          open ? "-right-5" : "left-0",
        )}
      >
        {open ? <ChevronLeft className="size-3.5" /> : <ChevronRight className="size-3.5" />}
      </button>
    </div>
  );
}

function SidebarItem({
  icon,
  selected,
  count,
  title,
  onClick,
  children,
}: {
  icon: ReactNode;
  selected: boolean;
  count: number;
  title?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      title={title}
      onClick={onClick}
      className={cn(
        "flex h-8 w-full shrink-0 cursor-pointer items-center gap-2 rounded-[9px] px-2 text-left text-[0.8889rem] font-semibold transition-colors",
        selected ? "bg-accent text-accent-foreground" : "text-muted hover:bg-default hover:text-foreground",
      )}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <span className={cn("tabular-nums", selected ? "opacity-80" : "opacity-60")}>{count}</span>
    </button>
  );
}
