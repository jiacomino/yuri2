import { useCallback, useEffect, useState } from "react";
import { db } from "@/lib/db";
import { notify } from "@/lib/notify";
import { resolveStartupWorkspace } from "@/lib/startupPref";
import type { Workspace } from "@/types/workspace";

const ACTIVE_KEY = "yuri2.activeWorkspace";

function reportError(action: string, err: unknown) {
  console.error(`[workspaces] ${action}`, err);
  notify({ title: `Impossible de ${action}`, body: String(err), kind: "alarm", durationMs: 8000 });
}

/** Espaces de travail persistés en SQLite + espace actif (mémorisé localement). */
export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeId, setActiveIdState] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    db.listWorkspaces()
      .then((list) => {
        setWorkspaces(list);
        let saved: string | null = null;
        try {
          saved = localStorage.getItem(ACTIVE_KEY);
        } catch {
          // stockage indisponible
        }
        setActiveIdState(resolveStartupWorkspace(list, saved));
      })
      .catch((err) => reportError("charger les espaces de travail", err))
      .finally(() => setLoaded(true));
  }, []);

  const setActiveId = useCallback((id: string) => {
    setActiveIdState(id);
    try {
      localStorage.setItem(ACTIVE_KEY, id);
    } catch {
      // stockage indisponible
    }
  }, []);

  const create = useCallback(
    async (name: string, color: string | null) => {
      try {
        const ws = await db.createWorkspace(name, color);
        setWorkspaces((list) => [...list, ws]);
        setActiveId(ws.id);
        return ws;
      } catch (err) {
        reportError("créer l'espace de travail", err);
        return null;
      }
    },
    [setActiveId],
  );

  const update = useCallback(async (id: string, name: string, color: string | null) => {
    setWorkspaces((list) => list.map((w) => (w.id === id ? { ...w, name, color } : w)));
    try {
      await db.updateWorkspace(id, name, color);
    } catch (err) {
      reportError("modifier l'espace de travail", err);
    }
  }, []);

  const move = useCallback(
    (id: string, direction: -1 | 1) => {
      const index = workspaces.findIndex((w) => w.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= workspaces.length) return;
      const next = [...workspaces];
      [next[index], next[target]] = [next[target], next[index]];
      setWorkspaces(next.map((w, i) => ({ ...w, position: i })));
      db.reorderWorkspaces(next.map((w) => w.id)).catch((err) =>
        reportError("réordonner les espaces de travail", err),
      );
    },
    [workspaces],
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await db.deleteWorkspace(id);
      } catch (err) {
        reportError("supprimer l'espace de travail", err);
        return;
      }
      const rest = workspaces.filter((w) => w.id !== id);
      setWorkspaces(rest);
      if (activeId === id && rest[0]) setActiveId(rest[0].id);
    },
    [workspaces, activeId, setActiveId],
  );

  return { workspaces, activeId, setActiveId, loaded, create, update, move, remove };
}
