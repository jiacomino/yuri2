import { cn } from "@/lib/utils";
import { PRIORITY_META } from "./meta";
import type { CardPriority } from "./state";

/** Pastille de priorité (non affichée pour « normal » côté carte). */
export function PriorityBadge({ priority }: { priority: CardPriority }) {
  const meta = PRIORITY_META[priority];
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[0.8148rem] font-bold", meta.chip)}>
      {meta.label}
    </span>
  );
}
