import { pointerWithin, rectIntersection, type CollisionDetection } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { QUADRANT_IDS, type EisenhowerState, type Quadrant } from "./state";

/**
 * Détection basée sur la position du pointeur : avec un `DragOverlay`, le rectangle
 * de l'élément reste à sa position d'origine et `closestCorners` renvoyait toujours le
 * même quadrant. `rectIntersection` sert de repli (clavier, cas limites).
 */
export const collisionDetection: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length > 0 ? hits : rectIntersection(args);
};

/** Quadrant contenant la tâche `id`, ou `id` lui-même si c'est un quadrant. */
export function findContainer(state: EisenhowerState, id: string): Quadrant | null {
  if ((QUADRANT_IDS as string[]).includes(id)) return id as Quadrant;
  return QUADRANT_IDS.find((q) => state.tasks[q].some((t) => t.id === id)) ?? null;
}

/** Réordonne dans un quadrant ou déplace vers un autre ; renvoie `null` si rien ne change. */
export function moveTask(state: EisenhowerState, activeId: string, overId: string): EisenhowerState | null {
  const from = findContainer(state, activeId);
  const to = findContainer(state, overId);
  if (!from || !to) return null;

  if (from === to) {
    const items = state.tasks[from];
    const oldIndex = items.findIndex((t) => t.id === activeId);
    const newIndex = overId === to ? items.length - 1 : items.findIndex((t) => t.id === overId);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return null;
    return { tasks: { ...state.tasks, [from]: arrayMove(items, oldIndex, newIndex) } };
  }

  const fromItems = [...state.tasks[from]];
  const toItems = [...state.tasks[to]];
  const idx = fromItems.findIndex((t) => t.id === activeId);
  if (idx === -1) return null;
  const [moving] = fromItems.splice(idx, 1);
  const overIdx = overId === to ? -1 : toItems.findIndex((t) => t.id === overId);
  toItems.splice(overIdx === -1 ? toItems.length : overIdx, 0, moving);
  return { tasks: { ...state.tasks, [from]: fromItems, [to]: toItems } };
}
