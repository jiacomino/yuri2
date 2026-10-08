import { pointerWithin, rectIntersection, type CollisionDetection } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { KanbanColumn } from "./state";

/**
 * Détection « pointeur d'abord » : avec un DragOverlay, le rectangle de l'élément glissé
 * reste à la source ; `pointerWithin` suit le vrai curseur, `rectIntersection` sert de repli
 * (clavier, cas limites).
 */
export const collisionDetection: CollisionDetection = (args) => {
  const pointer = pointerWithin(args);
  return pointer.length > 0 ? pointer : rectIntersection(args);
};

/** Colonne contenant `id` (id de carte), ou `id` lui-même si c'est une colonne. */
export function findColumnId(columns: KanbanColumn[], id: string): string | null {
  if (columns.some((c) => c.id === id)) return id;
  return columns.find((c) => c.cards.some((k) => k.id === id))?.id ?? null;
}

/**
 * Déplace la carte `cardId` à l'emplacement de `overId` (une carte ou une colonne).
 * Renvoie `columns` inchangé si rien ne bouge.
 */
export function moveCard(columns: KanbanColumn[], cardId: string, overId: string): KanbanColumn[] {
  const from = findColumnId(columns, cardId);
  const to = findColumnId(columns, overId);
  if (!from || !to) return columns;

  if (from === to) {
    const col = columns.find((c) => c.id === from)!;
    const oldIndex = col.cards.findIndex((k) => k.id === cardId);
    const newIndex = overId === to ? col.cards.length - 1 : col.cards.findIndex((k) => k.id === overId);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return columns;
    return columns.map((c) => (c.id === from ? { ...c, cards: arrayMove(c.cards, oldIndex, newIndex) } : c));
  }

  const fromCards = [...columns.find((c) => c.id === from)!.cards];
  const toCards = [...columns.find((c) => c.id === to)!.cards];
  const movingIdx = fromCards.findIndex((k) => k.id === cardId);
  if (movingIdx === -1) return columns;
  const [moving] = fromCards.splice(movingIdx, 1);
  const overIdx = overId === to ? -1 : toCards.findIndex((k) => k.id === overId);
  toCards.splice(overIdx === -1 ? toCards.length : overIdx, 0, moving);
  return columns.map((c) => (c.id === from ? { ...c, cards: fromCards } : c.id === to ? { ...c, cards: toCards } : c));
}

/** Ajoute la carte en fin de `targetColumnId` (menu « Déplacer vers »). */
export function moveCardToColumn(columns: KanbanColumn[], cardId: string, targetColumnId: string): KanbanColumn[] {
  const from = findColumnId(columns, cardId);
  if (!from || from === targetColumnId) return columns;
  const card = columns.find((c) => c.id === from)!.cards.find((k) => k.id === cardId)!;
  return columns.map((c) =>
    c.id === from
      ? { ...c, cards: c.cards.filter((k) => k.id !== cardId) }
      : c.id === targetColumnId
        ? { ...c, cards: [...c.cards, card] }
        : c,
  );
}
