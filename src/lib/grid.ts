import type { GroupDefinition } from "@/components/groups/types";

/** Grille du canevas (react-grid-layout). */
export const GRID_COLS = 24;
export const GRID_ROW_HEIGHT = 30;
export const GRID_MARGIN = 12;

/** Taille initiale d'un composant, déduite de sa taille dans la galerie. */
export function defaultGridSize(def: GroupDefinition<unknown>): { w: number; h: number } {
  const w = Math.min(GRID_COLS, def.preview.cols * 8);
  const h = Math.max(6, Math.round((def.preview.height + GRID_MARGIN) / (GRID_ROW_HEIGHT + GRID_MARGIN)));
  return { w, h };
}
