import { useCallback, useEffect, useRef, useState } from "react";
import { findDefinition } from "@/components/groups/registry";
import type { GroupKind } from "@/components/groups/types";
import { db } from "@/lib/db";
import { defaultGridSize } from "@/lib/grid";
import { genId } from "@/lib/id";
import { notify } from "@/lib/notify";
import type { GroupRecord, LayoutPatch } from "@/types/workspace";

/** Délai de regroupement des sauvegardes (plusieurs corps appellent onChange à chaque frappe). */
const SAVE_DELAY_MS = 400;

function reportError(action: string, err: unknown) {
  console.error(`[groups] ${action}`, err);
  notify({ title: `Impossible de ${action}`, body: String(err), kind: "alarm", durationMs: 8000 });
}

export type NewGroup = {
  kind: GroupKind;
  name: string;
  color: string | null;
  workspaceId: string;
  tags?: string[];
  /** État initial ; à défaut, celui du type. */
  state?: unknown;
};

/** Composants de tous les espaces, persistés en SQLite avec sauvegarde différée par composant. */
export function useGroups() {
  const [groups, setGroups] = useState<GroupRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const latest = useRef(new Map<string, GroupRecord>());
  const timers = useRef(new Map<string, number>());

  useEffect(() => {
    db.listGroups()
      .then((list) => {
        list.forEach((g) => latest.current.set(g.id, g));
        setGroups(list);
      })
      .catch((err) => reportError("charger les composants", err))
      .finally(() => setLoaded(true));
  }, []);

  const flush = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) window.clearTimeout(timer);
    timers.current.delete(id);
    const group = latest.current.get(id);
    if (group) db.upsertGroup(group).catch((err) => reportError("enregistrer le composant", err));
  }, []);

  // Écrit les sauvegardes en attente à la fermeture de la fenêtre.
  useEffect(() => {
    const flushAll = () => [...timers.current.keys()].forEach(flush);
    window.addEventListener("beforeunload", flushAll);
    return () => {
      window.removeEventListener("beforeunload", flushAll);
      flushAll();
    };
  }, [flush]);

  const scheduleSave = useCallback(
    (id: string) => {
      const previous = timers.current.get(id);
      if (previous !== undefined) window.clearTimeout(previous);
      timers.current.set(
        id,
        window.setTimeout(() => flush(id), SAVE_DELAY_MS),
      );
    },
    [flush],
  );

  const add = useCallback(({ kind, name, color, workspaceId, tags = [], state }: NewGroup) => {
    const def = findDefinition(kind);
    if (!def) return null;
    const { w, h } = defaultGridSize(def);
    // Placé sous le composant le plus bas de l'espace.
    const bottom = [...latest.current.values()]
      .filter((g) => g.workspaceId === workspaceId && !g.minimized)
      .reduce((max, g) => Math.max(max, g.y + g.h), 0);
    const group: GroupRecord = {
      id: genId(),
      workspaceId,
      kind,
      name,
      color,
      tags,
      x: 0,
      y: bottom,
      w,
      h,
      minimized: false,
      state: state ?? def.defaultState(),
    };
    latest.current.set(group.id, group);
    setGroups((list) => [...list, group]);
    db.upsertGroup(group).catch((err) => reportError("créer le composant", err));
    return group.id;
  }, []);

  const update = useCallback(
    (id: string, patch: Partial<Omit<GroupRecord, "id">>) => {
      const current = latest.current.get(id);
      if (!current) return;
      const next = { ...current, ...patch };
      latest.current.set(id, next);
      setGroups((list) => list.map((g) => (g.id === id ? next : g)));
      scheduleSave(id);
    },
    [scheduleSave],
  );

  /** Modifie l'état d'un composant à partir de sa valeur la plus récente (mises à jour hors rendu). */
  const updateState = useCallback(
    (id: string, fn: (state: unknown) => unknown) => {
      const current = latest.current.get(id);
      if (current) update(id, { state: fn(current.state) });
    },
    [update],
  );

  const remove = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) window.clearTimeout(timer);
    timers.current.delete(id);
    latest.current.delete(id);
    setGroups((list) => list.filter((g) => g.id !== id));
    db.deleteGroup(id).catch((err) => reportError("supprimer le composant", err));
  }, []);

  /** Oublie localement les composants d'un espace supprimé (la base les a déjà supprimés). */
  const dropWorkspace = useCallback((workspaceId: string) => {
    for (const [id, g] of latest.current) {
      if (g.workspaceId !== workspaceId) continue;
      const timer = timers.current.get(id);
      if (timer !== undefined) window.clearTimeout(timer);
      timers.current.delete(id);
      latest.current.delete(id);
    }
    setGroups((list) => list.filter((g) => g.workspaceId !== workspaceId));
  }, []);

  const applyLayout = useCallback((patches: LayoutPatch[]) => {
    const changed = patches.filter((p) => {
      const g = latest.current.get(p.id);
      return g && (g.x !== p.x || g.y !== p.y || g.w !== p.w || g.h !== p.h);
    });
    if (changed.length === 0) return;
    for (const p of changed) {
      const g = latest.current.get(p.id)!;
      latest.current.set(p.id, { ...g, x: p.x, y: p.y, w: p.w, h: p.h });
    }
    setGroups((list) => list.map((g) => latest.current.get(g.id) ?? g));
    db.saveLayouts(changed).catch((err) => reportError("enregistrer la disposition", err));
  }, []);

  return { groups, loaded, add, update, updateState, remove, dropWorkspace, applyLayout };
}
