import type { GroupKind } from "@/components/groups/types";

export type Workspace = {
  id: string;
  name: string;
  position: number;
  /** Couleur de l'onglet (hex), ou null. */
  color: string | null;
};

/** Un composant posé sur le canevas d'un espace de travail. */
export type GroupRecord = {
  id: string;
  workspaceId: string;
  kind: GroupKind;
  name: string;
  color: string | null;
  tags: string[];
  /** Position et taille en unités de grille. */
  x: number;
  y: number;
  w: number;
  h: number;
  minimized: boolean;
  /** État propre au type de composant (stocké en JSON). */
  state: unknown;
};

export type LayoutPatch = { id: string; x: number; y: number; w: number; h: number };
