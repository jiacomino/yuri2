import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { BodyProps } from "../types";
import { collisionDetection, moveTask } from "./dnd";
import { QUADRANTS } from "./quadrants";
import { QuadrantCell } from "./QuadrantCell";
import { QUADRANT_IDS, type EisenhowerState, type EisenhowerTask, type Quadrant } from "./state";
import { TaskDragPreview } from "./TaskDragPreview";
import { useTaskAlarms } from "./useTaskAlarms";

export function EisenhowerBody({ value, onChange }: BodyProps<EisenhowerState>) {
  const [addingIn, setAddingIn] = useState<Quadrant | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Petite distance d'activation : les clics simples restent des clics.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useTaskAlarms(value, onChange);

  function patchQuadrant(q: Quadrant, fn: (tasks: EisenhowerTask[]) => EisenhowerTask[]) {
    onChange({ tasks: { ...value.tasks, [q]: fn(value.tasks[q]) } });
  }

  function addTask(q: Quadrant, text: string) {
    const clean = text.trim();
    if (!clean) return;
    patchQuadrant(q, (ts) => [...ts, { id: crypto.randomUUID(), text: clean }]);
  }

  function updateTask(q: Quadrant, id: string, text: string) {
    const clean = text.trim();
    // Texte vidé = suppression.
    patchQuadrant(q, (ts) => (clean ? ts.map((t) => (t.id === id ? { ...t, text: clean } : t)) : ts.filter((t) => t.id !== id)));
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setDraggedId(null);
    if (!over) return;
    const next = moveTask(value, String(active.id), String(over.id));
    if (next) onChange(next);
  }

  const dragged = draggedId ? QUADRANT_IDS.flatMap((q) => value.tasks[q]).find((t) => t.id === draggedId) : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={({ active }) => setDraggedId(String(active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDraggedId(null)}
    >
      <div className="grid h-full min-h-0 grid-cols-2 grid-rows-2 gap-2.5">
        {QUADRANTS.map((q) => (
          <QuadrantCell
            key={q.id}
            quadrant={q}
            tasks={value.tasks[q.id]}
            editingId={editingId}
            adding={addingIn === q.id}
            onStartAdd={() => setAddingIn(q.id)}
            onSubmitAdd={(text) => {
              addTask(q.id, text);
              setAddingIn(null);
            }}
            onCancelAdd={() => setAddingIn(null)}
            onStartEdit={setEditingId}
            onCommitEdit={(id, text) => {
              updateTask(q.id, id, text);
              setEditingId(null);
            }}
            onCancelEdit={() => setEditingId(null)}
            onToggle={(id) => patchQuadrant(q.id, (ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))}
            onRemove={(id) => patchQuadrant(q.id, (ts) => ts.filter((t) => t.id !== id))}
            onSetAlarm={(id, alarmAt) =>
              patchQuadrant(q.id, (ts) => ts.map((t) => (t.id === id ? { ...t, alarmAt, alarmFired: false } : t)))
            }
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>{dragged ? <TaskDragPreview task={dragged} /> : null}</DragOverlay>
    </DndContext>
  );
}
