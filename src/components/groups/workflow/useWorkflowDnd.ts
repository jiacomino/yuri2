import { useState } from "react";
import {
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";

/**
 * Détection « pointeur d'abord » : avec un DragOverlay, le rectangle de l'élément
 * glissé reste à la source, donc les stratégies par rectangle retombent sur l'étape d'origine.
 */
const collisionDetection: CollisionDetection = (args) => {
  const pointer = pointerWithin(args);
  return pointer.length > 0 ? pointer : rectIntersection(args);
};

/** Câblage dnd-kit : capteurs, action en cours de glisser, dépôt. */
export function useWorkflowDnd(onDrop: (draggedId: string, overId: string) => void) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  return {
    activeId,
    contextProps: {
      sensors,
      collisionDetection,
      onDragStart: (event: DragStartEvent) => setActiveId(String(event.active.id)),
      onDragEnd: ({ active, over }: DragEndEvent) => {
        setActiveId(null);
        if (over) onDrop(String(active.id), String(over.id));
      },
      onDragCancel: () => setActiveId(null),
    },
  };
}
