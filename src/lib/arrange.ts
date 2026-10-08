import { GRID_COLS } from "@/lib/grid";
import type { GroupRecord, LayoutPatch } from "@/types/workspace";

/**
 * Range les composants en lignes alignées : ordre de lecture actuel (haut → bas, gauche →
 * droite) conservé, composants posés côte à côte depuis la gauche, nouvelle ligne quand la
 * largeur de la grille est dépassée. Dans une ligne, chacun prend la hauteur du plus haut
 * (jamais réduit), pour des bas de ligne alignés. Les largeurs sont conservées.
 */
export function arrangeInRows(groups: GroupRecord[]): LayoutPatch[] {
  const ordered = [...groups].sort((a, b) => a.y - b.y || a.x - b.x);
  const patches: LayoutPatch[] = [];
  let row: GroupRecord[] = [];
  let rowWidth = 0;
  let top = 0;

  function flush() {
    if (row.length === 0) return;
    const height = Math.max(...row.map((g) => g.h));
    let x = 0;
    for (const g of row) {
      patches.push({ id: g.id, x, y: top, w: g.w, h: height });
      x += g.w;
    }
    top += height;
    row = [];
    rowWidth = 0;
  }

  for (const g of ordered) {
    const w = Math.min(g.w, GRID_COLS);
    if (rowWidth + w > GRID_COLS) flush();
    row.push(w === g.w ? g : { ...g, w });
    rowWidth += w;
  }
  flush();
  return patches;
}
