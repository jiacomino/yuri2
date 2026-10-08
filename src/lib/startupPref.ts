import type { Workspace } from "@/types/workspace";

/** Espace ouvert au démarrage : le dernier utilisé, le premier onglet, ou un espace fixé. */
export type StartupPref = { kind: "last" } | { kind: "first" } | { kind: "workspace"; id: string };

const KEY = "yuri2.startupWorkspace";

export function loadStartupPref(): StartupPref {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "null") as StartupPref | null;
    if (parsed?.kind === "first") return parsed;
    if (parsed?.kind === "workspace" && typeof parsed.id === "string") return parsed;
  } catch {
    // stockage indisponible ou valeur illisible
  }
  return { kind: "last" };
}

export function saveStartupPref(pref: StartupPref): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(pref));
  } catch {
    // stockage indisponible
  }
}

/** Espace à activer au lancement ; repli sur le premier si la cible n'existe plus. */
export function resolveStartupWorkspace(list: Workspace[], lastUsedId: string | null): string | null {
  const pref = loadStartupPref();
  const wanted = pref.kind === "workspace" ? pref.id : pref.kind === "last" ? lastUsedId : null;
  return list.some((w) => w.id === wanted) ? wanted : (list[0]?.id ?? null);
}
