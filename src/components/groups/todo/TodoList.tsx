import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ListChecks } from "lucide-react";
import type { TodoItem } from "./state";
import { TodoItemRow, type TodoItemActions } from "./TodoItemRow";

/** Verrouille le glisser sur l'axe vertical. */
const verticalOnly: Modifier = ({ transform }) => ({ ...transform, x: 0 });

type TodoListProps = {
  items: TodoItem[];
  /** Fabrique les actions d'une tâche donnée. */
  actionsFor: (item: TodoItem) => TodoItemActions;
  onReorder: (activeId: string, overId: string) => void;
};

/** Liste triable (glisser-déposer par la poignée) des tâches de l'onglet actif. */
export function TodoList({ items, actionsFor, onReorder }: TodoListProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (over && active.id !== over.id) onReorder(String(active.id), String(over.id));
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-center text-[0.8889rem] text-muted">
        <span className="grid size-10 place-items-center rounded-xl bg-accent/10 text-accent">
          <ListChecks className="size-5" />
        </span>
        Aucune tâche. Tapez au-dessus pour en ajouter une.
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[verticalOnly]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
          {items.map((item) => (
            <TodoItemRow key={item.id} item={item} {...actionsFor(item)} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
