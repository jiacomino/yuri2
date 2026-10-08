import type { HTMLAttributes } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

type DragHandleProps = HTMLAttributes<HTMLButtonElement> & { label: string };

/** Poignée de glisser-déposer : seule zone qui démarre le drag, visible au survol. */
export function DragHandle({ label, className, ...props }: DragHandleProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title="Glisser pour réordonner"
      {...props}
      className={cn(
        "inline-flex h-6 w-4 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted/60",
        "opacity-0 transition-opacity group-hover/item:opacity-100 hover:text-muted focus-visible:opacity-100 active:cursor-grabbing",
        className,
      )}
    >
      <GripVertical className="size-3.5" />
    </button>
  );
}
