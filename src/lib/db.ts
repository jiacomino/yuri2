import { invoke } from "@tauri-apps/api/core";
import type { GroupKind } from "@/components/groups/types";
import type { GroupRecord, LayoutPatch, Workspace } from "@/types/workspace";

/** Forme d'un composant côté Rust : l'état est une chaîne JSON. */
type GroupRow = Omit<GroupRecord, "state" | "kind"> & { kind: string; content: string };

function toRecord(row: GroupRow): GroupRecord {
  let state: unknown = null;
  try {
    state = JSON.parse(row.content);
  } catch {
    // Contenu illisible : le composant repartira de son état par défaut.
  }
  const { content: _content, ...rest } = row;
  return { ...rest, kind: row.kind as GroupKind, state };
}

function toRow({ state, ...rest }: GroupRecord): GroupRow {
  return { ...rest, content: JSON.stringify(state ?? null) };
}

export const db = {
  listWorkspaces: () => invoke<Workspace[]>("list_workspaces"),
  createWorkspace: (name: string, color: string | null) =>
    invoke<Workspace>("create_workspace", { name, color }),
  updateWorkspace: (id: string, name: string, color: string | null) =>
    invoke<void>("update_workspace", { id, name, color }),
  reorderWorkspaces: (ids: string[]) => invoke<void>("reorder_workspaces", { ids }),
  deleteWorkspace: (id: string) => invoke<void>("delete_workspace", { id }),

  listGroups: async () => (await invoke<GroupRow[]>("list_groups")).map(toRecord),
  upsertGroup: (group: GroupRecord) => invoke<void>("upsert_group", { group: toRow(group) }),
  deleteGroup: (id: string) => invoke<void>("delete_group", { id }),
  saveLayouts: (patches: LayoutPatch[]) => invoke<void>("save_layouts", { patches }),
};
