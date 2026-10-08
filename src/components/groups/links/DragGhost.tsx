import { GripVertical } from "lucide-react";
import type { LinkItem } from "./state";
import { Favicon } from "./Favicon";

/** Aperçu flottant de l'élément en cours de déplacement. */
export function DragGhost({ item }: { item: LinkItem }) {
  if (item.kind === "separator") {
    return (
      <div className="flex cursor-grabbing items-center gap-2 rounded-[10px] bg-surface px-2.5 py-2 text-[0.8148rem] font-bold tracking-[.06em] text-muted uppercase shadow-[0_2px_8px_rgba(16,24,40,.10)]">
        <GripVertical className="size-3.5" />
        {item.name}
      </div>
    );
  }
  return (
    <div className="flex cursor-grabbing items-center gap-3 rounded-[10px] bg-surface px-2.5 py-2 shadow-[0_2px_8px_rgba(16,24,40,.10)] ring-1 ring-accent/40">
      <GripVertical className="size-3.5 text-muted" />
      <Favicon url={item.url} />
      <span className="truncate font-semibold">{item.name}</span>
    </div>
  );
}
