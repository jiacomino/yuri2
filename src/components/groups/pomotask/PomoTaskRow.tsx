import { Button } from "@heroui/react";
import { Pencil, Play, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PomoTask } from "./state";

type PomoTaskRowProps = {
  task: PomoTask;
  isActive: boolean;
  isRunning: boolean;
  onSelect: () => void;
  onCycleEstimate: () => void;
  onStartEdit: () => void;
  onRemove: () => void;
};

/** Ligne de tâche : clic = charger dans le minuteur, pastille = changer l'estimation. */
export function PomoTaskRow({
  task,
  isActive,
  isRunning,
  onSelect,
  onCycleEstimate,
  onStartEdit,
  onRemove,
}: PomoTaskRowProps) {
  return (
    <li
      onClick={onSelect}
      title={isActive ? undefined : "Cliquer pour charger dans le minuteur"}
      className={cn(
        "group/item flex cursor-pointer items-center gap-2 rounded-[10px] px-2.5 py-2 text-[0.963rem] font-medium transition-[background-color,box-shadow]",
        isActive
          ? "bg-accent/10 font-semibold text-foreground ring-1 ring-accent/30"
          : "list-card bg-surface shadow-[0_1px_2px_rgba(16,24,40,.08)]",
      )}
    >
      {isActive && (
        <Play
          className={cn("size-3 shrink-0 fill-current text-accent", isRunning && "animate-pulse")}
          aria-label="Tâche active"
        />
      )}
      <span className="min-w-0 flex-1 leading-snug break-words">{task.text}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onCycleEstimate();
        }}
        title={`Estimation : ${task.estimateMin} min — cliquer pour changer`}
        className={cn(
          "shrink-0 cursor-pointer rounded-md px-2 py-0.5 text-[0.8148rem] font-bold tabular-nums transition-colors",
          isActive ? "bg-accent/15 text-accent hover:bg-accent/25" : "bg-default text-muted hover:text-foreground",
        )}
      >
        {task.estimateMin} min
      </button>
      <div
        className="flex shrink-0 opacity-0 transition-opacity group-hover/item:opacity-100 focus-within:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <Button isIconOnly size="sm" variant="ghost" aria-label="Modifier" onPress={onStartEdit}>
          <Pencil className="size-3.5" />
        </Button>
        <Button isIconOnly size="sm" variant="ghost" aria-label="Supprimer" onPress={onRemove} className="hover:text-danger">
          <X className="size-3.5" />
        </Button>
      </div>
    </li>
  );
}
