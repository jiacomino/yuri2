import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { AddTaskButton } from "./AddTaskButton";
import type { QuadrantMeta } from "./quadrants";
import { SortableTask } from "./SortableTask";
import type { EisenhowerTask } from "./state";
import { TaskEditor } from "./TaskEditor";

type QuadrantCellProps = {
  quadrant: QuadrantMeta;
  tasks: EisenhowerTask[];
  editingId: string | null;
  adding: boolean;
  onStartAdd: () => void;
  onSubmitAdd: (text: string) => void;
  onCancelAdd: () => void;
  onStartEdit: (id: string) => void;
  onCommitEdit: (id: string, text: string) => void;
  onCancelEdit: () => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onSetAlarm: (id: string, alarmAt: string | undefined) => void;
};

/** Un quadrant de la matrice : en-tête, liste triable (zone de dépôt) et ajout. */
export function QuadrantCell({
  quadrant: q,
  tasks,
  editingId,
  adding,
  onStartAdd,
  onSubmitAdd,
  onCancelAdd,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  onToggle,
  onRemove,
  onSetAlarm,
}: QuadrantCellProps) {
  const { setNodeRef, isOver } = useDroppable({ id: q.id });
  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col gap-2 rounded-xl p-2.5 transition-shadow",
        q.zoneClass,
        isOver && "ring-2 ring-accent/40",
      )}
    >
      <div className="flex min-w-0 items-center gap-1.5 px-0.5">
        <span className={cn("size-2 shrink-0 rounded-full", q.dotClass)} />
        <span className={cn("shrink-0 text-[0.8889rem] font-bold", q.titleClass)}>{q.label}</span>
        <span className="min-w-0 truncate text-[0.8148rem] font-medium text-muted">{q.hint}</span>
        <span
          className="ml-auto shrink-0 text-[0.8889rem] font-semibold text-muted tabular-nums"
          title={`${doneCount} faite(s) sur ${tasks.length}`}
        >
          {doneCount > 0 ? `${doneCount}/${tasks.length}` : tasks.length}
        </span>
      </div>

      <div ref={setNodeRef} className="-m-0.5 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-0.5">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) =>
            editingId === task.id ? (
              <TaskEditor
                key={task.id}
                initial={task.text}
                onCommit={(text) => onCommitEdit(task.id, text)}
                onCancel={onCancelEdit}
              />
            ) : (
              <SortableTask
                key={task.id}
                task={task}
                onToggle={() => onToggle(task.id)}
                onStartEdit={() => onStartEdit(task.id)}
                onRemove={() => onRemove(task.id)}
                onSetAlarm={(alarmAt) => onSetAlarm(task.id, alarmAt)}
              />
            ),
          )}
        </SortableContext>

        {adding ? (
          <TaskEditor
            placeholder="Nouvelle tâche…"
            onCommit={(text) => (text.trim() ? onSubmitAdd(text) : onCancelAdd())}
            onCancel={onCancelAdd}
          />
        ) : (
          <AddTaskButton onPress={onStartAdd} />
        )}
      </div>
    </div>
  );
}
