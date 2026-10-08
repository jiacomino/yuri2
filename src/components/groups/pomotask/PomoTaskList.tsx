import { useState } from "react";
import { PomoTaskEditRow } from "./PomoTaskEditRow";
import { PomoTaskRow } from "./PomoTaskRow";
import { nextEstimate, type PomoTask } from "./state";

type PomoTaskListProps = {
  tasks: PomoTask[];
  activeTaskId: string | null;
  isRunning: boolean;
  onSelect: (id: string) => void;
  onUpdateText: (id: string, text: string) => void;
  onChangeEstimate: (id: string, minutes: number) => void;
  onRemove: (id: string) => void;
};

export function PomoTaskList({
  tasks,
  activeTaskId,
  isRunning,
  onSelect,
  onUpdateText,
  onChangeEstimate,
  onRemove,
}: PomoTaskListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (tasks.length === 0) {
    return (
      <p className="m-0 px-3 py-6 text-center text-[0.8889rem] text-muted">
        Aucune tâche. Ajoutes-en une au-dessus, puis clique dessus pour la lancer.
      </p>
    );
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
      {tasks.map((task) =>
        editingId === task.id ? (
          <PomoTaskEditRow
            key={task.id}
            task={task}
            onCommit={(text) => {
              onUpdateText(task.id, text);
              setEditingId(null);
            }}
            onCancel={() => setEditingId(null)}
            onChangeEstimate={(m) => onChangeEstimate(task.id, m)}
          />
        ) : (
          <PomoTaskRow
            key={task.id}
            task={task}
            isActive={task.id === activeTaskId}
            isRunning={isRunning}
            onSelect={() => onSelect(task.id)}
            onCycleEstimate={() => onChangeEstimate(task.id, nextEstimate(task.estimateMin))}
            onStartEdit={() => setEditingId(task.id)}
            onRemove={() => onRemove(task.id)}
          />
        ),
      )}
    </ul>
  );
}
