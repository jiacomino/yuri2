import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIORITY_META } from "./priority";
import type { WorkflowAction } from "./state";

/** Fantôme affiché sous le pointeur pendant le glisser. */
export function DragPreview({ action }: { action: WorkflowAction }) {
  return (
    <div className="flex max-w-80 cursor-grabbing items-center gap-1.5 rounded-[10px] bg-surface px-2.5 py-2 text-[0.9259rem] font-semibold shadow-[0_8px_24px_rgba(16,24,40,.18)]">
      <Flag className={cn("size-3.5 shrink-0", PRIORITY_META[action.priority].text)} />
      <span className="truncate">{action.title}</span>
    </div>
  );
}
