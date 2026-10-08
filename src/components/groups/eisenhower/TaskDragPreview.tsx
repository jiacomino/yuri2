import { GripVertical } from "lucide-react";
import type { EisenhowerTask } from "./state";

/** Aperçu flottant pendant le glisser-déposer. */
export function TaskDragPreview({ task }: { task: EisenhowerTask }) {
  return (
    <div className="flex rotate-[1.5deg] cursor-grabbing items-start gap-1.5 rounded-[10px] bg-surface px-2 py-2 text-[0.963rem] font-medium shadow-[0_12px_28px_rgba(16,24,40,.18),0_2px_6px_rgba(16,24,40,.08)] ring-1 ring-accent/20">
      <GripVertical className="mt-0.5 size-3.5 shrink-0 text-muted" />
      <span className="min-w-0 flex-1 leading-snug break-words">{task.text}</span>
    </div>
  );
}
