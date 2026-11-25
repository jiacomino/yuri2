/**
 * Applications partagées : une seule liste, saisie dans Paramètres › Import / Export
 * (clé `importExport`), utilisée par tous les composants qui rattachent des éléments à
 * une application (calendrier, Kanban, suivi de projet, mise en production, import /
 * export). Les composants ne stockent plus que l'id (`appId`) ; un id inconnu (application
 * supprimée) s'affiche comme « sans application ».
 */
import { useEffect, useMemo, useRef } from "react";
import { genId } from "@/lib/id";
import { errorMessage, peekIeSettings, updateIeSettings, useIeSettings, type IeApplication } from "@/lib/importExport";
import { notify } from "@/lib/notify";

export type SharedApp = { id: string; name: string; color: string };

/** Couleurs proposées aux nouvelles applications, dans l'ordre. */
export const APP_COLORS = ["#4f7cff", "#a855f7", "#10b981", "#f59e0b", "#ec4899", "#06b6d4", "#ef4444", "#64748b"];

export function nextAppColor(count: number): string {
  return APP_COLORS[count % APP_COLORS.length];
}

const norm = (s: string) => s.trim().toLowerCase();

function toShared(list: IeApplication[]): SharedApp[] {
  return list.map((a, i) => ({ id: a.id, name: a.name, color: a.color || nextAppColor(i) }));
}

/** Applications des paramètres (liste vide pendant le premier chargement). */
export function useSharedApps(): SharedApp[] {
  const settings = useIeSettings();
  const list = settings?.applications;
  return useMemo(() => toShared(list ?? []), [list]);
}

function fail(title: string) {
  return (e: unknown) => {
    notify({ title, body: errorMessage(e), kind: "alarm", durationMs: 8000 });
    return undefined;
  };
}

/**
 * Crée une application (ou reprend celle du même nom) et renvoie son id tout de suite :
 * l'enregistrement se fait en arrière-plan, l'id est fixé dès maintenant.
 */
export function createSharedApp(name: string, color?: string): string | undefined {
  const clean = name.trim();
  if (!clean) return undefined;
  const same = peekIeSettings()?.applications.find((a) => norm(a.name) === norm(clean));
  if (same) return same.id;
  const id = genId();
  void updateIeSettings((s) => {
    if (s.applications.some((a) => norm(a.name) === norm(clean))) return { next: null, result: undefined };
    const app: IeApplication = { id, name: clean, color: color || nextAppColor(s.applications.length), notes: "" };
    return { next: { ...s, applications: [...s.applications, app] }, result: undefined };
  }).catch(fail("Application non enregistrée"));
  return id;
}

/** Variante qui renvoie l'id réel (celui de l'application existante en cas de doublon). */
export function ensureSharedApp(name: string, color?: string): Promise<string | undefined> {
  const clean = name.trim();
  if (!clean) return Promise.resolve(undefined);
  return updateIeSettings((s) => {
    const existing = s.applications.find((a) => norm(a.name) === norm(clean));
    if (existing) return { next: null, result: existing.id as string | undefined };
    const app: IeApplication = { id: genId(), name: clean, color: color || nextAppColor(s.applications.length), notes: "" };
    return { next: { ...s, applications: [...s.applications, app] }, result: app.id };
  }).catch(fail("Application non enregistrée"));
}

export function updateSharedApp(id: string, patch: Partial<Pick<SharedApp, "name" | "color">>) {
  void updateIeSettings((s) => ({
    next: { ...s, applications: s.applications.map((a) => (a.id === id ? { ...a, ...patch } : a)) },
    result: undefined,
  })).catch(fail("Application non enregistrée"));
}

export function removeSharedApp(id: string) {
  void updateIeSettings((s) => ({
    next: { ...s, applications: s.applications.filter((a) => a.id !== id) },
    result: undefined,
  })).catch(fail("Application non supprimée"));
}

/**
 * Reprend les applications propres à un composant (versions antérieures, import yuri 1)
 * dans la liste partagée. Rapprochement par id puis par nom (sans casse) ; les autres
 * sont ajoutées en gardant leur id. Renvoie la correspondance ancien id → id partagé.
 */
export function adoptLocalApps(local: SharedApp[]): Promise<Map<string, string>> {
  return updateIeSettings((s) => {
    const apps = [...s.applications];
    const map = new Map<string, string>();
    let added = false;
    for (const a of local) {
      if (!a?.id) continue;
      const found = apps.find((x) => x.id === a.id) ?? (a.name?.trim() ? apps.find((x) => norm(x.name) === norm(a.name)) : undefined);
      if (found) {
        map.set(a.id, found.id);
      } else if (a.name?.trim()) {
        apps.push({ id: a.id, name: a.name.trim(), color: a.color || nextAppColor(apps.length), notes: "" });
        map.set(a.id, a.id);
        added = true;
      }
    }
    return { next: added ? { ...s, applications: apps } : null, result: map };
  });
}

/**
 * Migration au montage d'un composant : si son état contient encore des applications
 * locales, elles passent dans la liste partagée puis l'état est réécrit sans elles,
 * avec les `appId` éventuellement renumérotés par `remap`.
 */
export function useAdoptLocalApps<S extends { apps?: SharedApp[] }>(
  value: S,
  onChange: (next: S) => void,
  remap: (state: S, map: Map<string, string>) => S,
) {
  const latest = useRef({ value, onChange, remap });
  latest.current = { value, onChange, remap };
  const pending = useRef(false);
  const local = value.apps;

  useEffect(() => {
    if (!local || local.length === 0 || pending.current) return;
    pending.current = true;
    adoptLocalApps(local)
      .then((map) => {
        const { value: cur, onChange: change, remap: fn } = latest.current;
        change({ ...fn(cur, map), apps: [] });
      })
      .catch(fail("Reprise des applications impossible"))
      .finally(() => {
        pending.current = false;
      });
  }, [local]);
}
