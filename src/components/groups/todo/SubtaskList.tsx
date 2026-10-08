import type { TodoSubtask } from "./state";
import { InlineInput } from "./InlineInput";
import { SubtaskRow } from "./SubtaskRow";

type SubtaskListProps = {
  subtasks: TodoSubtask[];
  adding: boolean;
  onStopAdding: () => void;
  onAdd: (text: string) => void;
  onToggle: (subId: string) => void;
  onUpdate: (subId: string, text: string) => void;
  onRemove: (subId: string) => void;
};

/** Sous-tâches indentées sous une tâche, avec le champ d'ajout. */
export function SubtaskList({ subtasks, adding, onStopAdding, onAdd, onToggle, onUpdate, onRemove }: SubtaskListProps) {
  if (subtasks.length === 0 && !adding) return null;
  const done = subtasks.filter((s) => s.done).length;

  return (
    <div className="mr-1 mb-1.5 ml-[18px] border-l-2 border-border pl-3">
      {subtasks.length > 0 && (
        <div className="px-1.5 pb-0.5 text-[0.8148rem] font-semibold tabular-nums text-muted">
          {done}/{subtasks.length} sous-tâche{subtasks.length > 1 ? "s" : ""}
        </div>
      )}
      <ul className="m-0 flex list-none flex-col p-0">
        {subtasks.map((sub) => (
          <SubtaskRow
            key={sub.id}
            subtask={sub}
            onToggle={() => onToggle(sub.id)}
            onUpdate={(text) => onUpdate(sub.id, text)}
            onRemove={() => onRemove(sub.id)}
          />
        ))}
        {adding && (
          <li className="py-0.5">
            <InlineInput
              placeholder="Sous-tâche…"
              ariaLabel="Nouvelle sous-tâche"
              className="h-6 text-xs"
              cancelOnBlur
              onCommit={(text) => {
                if (text.trim()) onAdd(text.trim());
                onStopAdding();
              }}
              onCancel={onStopAdding}
            />
          </li>
        )}
      </ul>
    </div>
  );
}
