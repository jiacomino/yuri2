import { useState } from "react";
import { Button } from "@heroui/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TodoSubtask } from "./state";
import { InlineInput } from "./InlineInput";
import { TaskCheckbox } from "./TaskCheckbox";

type SubtaskRowProps = {
  subtask: TodoSubtask;
  onToggle: () => void;
  /** Texte vide = suppression. */
  onUpdate: (text: string) => void;
  onRemove: () => void;
};

export function SubtaskRow({ subtask, onToggle, onUpdate, onRemove }: SubtaskRowProps) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="py-0.5">
        <InlineInput
          initial={subtask.text}
          ariaLabel="Modifier la sous-tâche"
          className="h-6 text-xs"
          onCommit={(text) => {
            onUpdate(text);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="list-row group/sub flex items-center gap-2 rounded-lg px-1.5 py-1">
      <TaskCheckbox small isSelected={subtask.done} onChange={onToggle} label={subtask.text} />
      <span
        onClick={() => setEditing(true)}
        title="Cliquer pour modifier"
        className={cn(
          "flex-1 cursor-text break-words text-[0.9259rem] font-medium leading-snug",
          subtask.done && "font-normal text-muted line-through",
        )}
      >
        {subtask.text}
      </span>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label={`Supprimer ${subtask.text}`}
        onPress={onRemove}
        className="size-5 min-w-5 text-muted opacity-0 group-hover/sub:opacity-100 hover:text-danger"
      >
        <X className="size-3" />
      </Button>
    </li>
  );
}
