import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, Checkbox } from "@heroui/react";
import { GripVertical, X } from "lucide-react";
import { AlarmControl } from "@/components/shared/AlarmControl";
import { cn } from "@/lib/utils";
import type { EisenhowerTask } from "./state";

type SortableTaskProps = {
  task: EisenhowerTask;
  onToggle: () => void;
  onStartEdit: () => void;
  onRemove: () => void;
  onSetAlarm: (alarmAt: string | undefined) => void;
};

/**
 * Carte de tâche déplaçable. Seule la poignée lance le glisser : case à cocher, texte,
 * alarme et suppression restent cliquables normalement.
 */
export function SortableTask({ task, onToggle, onStartEdit, onRemove, onSetAlarm }: SortableTaskProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "list-card group/task flex items-start gap-1.5 rounded-[10px] bg-surface py-2 pr-1 pl-1 text-[0.963rem] font-medium shadow-[0_1px_2px_rgba(16,24,40,.08)]",
        isDragging && "opacity-40 shadow-none",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Déplacer la tâche"
        className="mt-0.5 shrink-0 cursor-grab touch-none text-muted opacity-40 transition-opacity group-hover/task:opacity-100 active:cursor-grabbing"
      >
        <GripVertical className="size-3.5" />
      </button>

      <Checkbox
        isSelected={!!task.done}
        onChange={onToggle}
        aria-label={task.done ? "Décocher" : "Marquer comme fait"}
        className="mt-0.5 shrink-0"
      >
        <Checkbox.Content>
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
        </Checkbox.Content>
      </Checkbox>

      <span
        onClick={onStartEdit}
        title="Cliquer pour modifier"
        className={cn(
          "min-w-0 flex-1 cursor-text pt-px leading-snug break-words whitespace-pre-wrap transition-opacity",
          task.done && "font-normal text-muted line-through",
        )}
      >
        {task.text}
      </span>

      <div className="-my-1 flex shrink-0 items-center">
        <AlarmControl
          alarmAt={task.alarmAt}
          alarmFired={task.alarmFired}
          onChange={onSetAlarm}
          label={task.text}
          className={cn(!task.alarmAt && "opacity-0 group-hover/task:opacity-100 focus-visible:opacity-100")}
        />
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          aria-label="Supprimer"
          onPress={onRemove}
          className="opacity-0 group-hover/task:opacity-100 hover:text-danger focus-visible:opacity-100"
        >
          <X className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
