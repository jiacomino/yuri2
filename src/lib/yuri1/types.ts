/** Données brutes lues dans la base yuri 1 (voir `src-tauri/src/yuri1.rs`). */
export type V1Workspace = { id: string; name: string; position: number; color: string | null };

export type V1Group = {
  id: string;
  workspaceId: string;
  kind: string;
  name: string;
  color: string | null;
  /** Tableau JSON de chaînes. */
  tags: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minimized: boolean;
  /** État JSON du composant (vide pour les liens, rangés dans `tabs`/`items`). */
  content: string;
};

export type V1Tab = { id: string; groupId: string; name: string };
export type V1Item = { id: string; tabId: string; name: string; url: string; kind: string };

export type V1Data = {
  path: string;
  workspaces: V1Workspace[];
  groups: V1Group[];
  tabs: V1Tab[];
  items: V1Item[];
};

/**
 * Convertit l'état yuri 1 d'un type de composant (JSON déjà parsé, `null` si vide
 * ou illisible) en état yuri2. Doit tolérer les champs absents ou mal typés.
 */
export type Converter<S> = (raw: unknown) => S;
