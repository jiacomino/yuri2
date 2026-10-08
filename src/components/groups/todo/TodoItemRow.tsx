import { useState } from "react";
import { Button } from "@heroui/react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ListPlus, Pencil, X } from "lucide-react";
import { AlarmControl } from "@/components/shared/AlarmControl";
import { cn } from "@/lib/utils";
import type { TodoItem, TodoPriority } from "./state";
import { InlineInput } from "./InlineInput";
import { PriorityMenu } from "./PriorityMenu";
import { SubtaskList } from "./SubtaskList";
import { TaskCheckbox } from "./TaskCheckbox";

export type TodoItemActions = {
  onToggle: () => void;
  /** Texte vide = suppression. */
  onUpdate: (text: string) => void;
  onRemove: () => void;
  onSetAlarm: (alarmAt: string | undefined) => void;
  onSetPriority: (priority: TodoPriority | undefined) => void;
  onAddSubtask: (text: string) => void;
  onToggleSubtask: (subId: string) => void;
  onUpdateSubtask: (subId: string, text: string) => void;
  onRemoveSubtask: (subId: string) => void;
};

type TodoItemRowProps = TodoItemActions & {
  item: TodoItem;
};

/** Une tâche : poignée, case, texte éditable, priorité, alarme, sous-tâches, actions. */
export function TodoItemRow({ item, ...actions }: TodoItemRowProps) {
  const [editing, setEditing] = useState(false);
  const [addingSub, setAddingSub] = useState(false);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const subtasks = item.subtasks ?? [];
  const hover = "opacity-0 group-hover/item:opacity-100 focus-visible:opacity-100";

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "list-row group/item relative rounded-[10px]",
        isDragging && "z-10 bg-surface shadow-[0_12px_28px_rgba(16,24,40,.16),0_2px_6px_rgba(16,24,40,.08)]",
      )}
    >
      <div className="flex items-center gap-2.5 py-1.5 pr-1 pl-2.5">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Déplacer ${item.text}`}
          className={cn("-mr-1.5 -ml-2 w-3.5 shrink-0 cursor-grab touch-none text-muted active:cursor-grabbing", hover)}
        >
          <GripVertical className="size-3.5" />
        </button>
        <TaskCheckbox isSelected={item.done} onChange={actions.onToggle} label={item.text} />

        {editing ? (
          <div className="min-w-0 flex-1">
            <InlineInput
              initial={item.text}
              ariaLabel="Modifier la tâche"
              onCommit={(text) => {
                actions.onUpdate(text);
                setEditing(false);
              }}
              onCancel={() => setEditing(false)}
            />
          </div>
        ) : (
          <span
            onClick={() => setEditing(true)}
            title="Cliquer pour modifier"
            className={cn(
              "min-w-0 flex-1 cursor-text break-words text-[0.963rem] font-semibold leading-snug transition-colors",
              item.done && "font-normal text-muted line-through",
            )}
          >
            {item.text}
          </span>
        )}

        {item.alarmAt && !editing && (
          <span
            className={cn(
              "shrink-0 rounded-md px-1.5 py-0.5 text-[0.8148rem] font-semibold tabular-nums",
              item.alarmFired
                ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
                : "bg-default text-muted",
              item.done && "opacity-60",
            )}
          >
            {formatAlarmChip(item.alarmAt)}
          </span>
        )}

        {(item.priority || item.alarmFired) && (
          <div className="-my-1 flex shrink-0 items-center">
            {item.priority && <PriorityMenu priority={item.priority} onChange={actions.onSetPriority} />}
            {item.alarmFired && (
              <AlarmControl
                alarmAt={item.alarmAt}
                alarmFired={item.alarmFired}
                onChange={actions.onSetAlarm}
                label={item.text}
                className="size-6 min-w-6"
              />
            )}
          </div>
        )}

        {/* Actions au survol, superposées : elles ne réservent pas de place au texte. */}
        <div className="absolute top-1 right-1 hidden items-center rounded-lg bg-surface p-0.5 shadow-[0_1px_3px_rgba(16,24,40,.12)] ring-1 ring-black/[.04] group-focus-within/item:flex group-hover/item:flex dark:ring-white/[.06]">
          {!item.priority && <PriorityMenu priority={item.priority} onChange={actions.onSetPriority} />}
          {!item.alarmFired && (
            <AlarmControl
              alarmAt={item.alarmAt}
              alarmFired={item.alarmFired}
              onChange={actions.onSetAlarm}
              label={item.text}
              className="size-6 min-w-6"
            />
          )}
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label="Ajouter une sous-tâche"
            onPress={() => setAddingSub(true)}
            className="size-6 min-w-6 text-muted"
          >
            <ListPlus className="size-3.5" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={`Modifier ${item.text}`}
            onPress={() => setEditing(true)}
            className="size-6 min-w-6 text-muted"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={`Supprimer ${item.text}`}
            onPress={actions.onRemove}
            className="size-6 min-w-6 text-muted hover:text-danger"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </div>

      <SubtaskList
        subtasks={subtasks}
        adding={addingSub}
        onStopAdding={() => setAddingSub(false)}
        onAdd={actions.onAddSubtask}
        onToggle={actions.onToggleSubtask}
        onUpdate={actions.onUpdateSubtask}
        onRemove={actions.onRemoveSubtask}
      />
    </li>
  );
}

/** Libellé court de l'alarme : heure seule si c'est aujourd'hui, sinon jour + heure. */
function formatAlarmChip(iso: string): string {
  const dt = new Date(iso);
  const time = dt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (dt.toDateString() === new Date().toDateString()) return time;
  const day = dt.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return `${day} ${time}`;
}
