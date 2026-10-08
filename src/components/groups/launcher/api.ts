import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import type { LaunchApp } from "./state";

export type InstalledApp = {
  name: string;
  path: string;
  /** Sous-dossier du menu Démarrer ou « Microsoft Store ». */
  folder: string;
};

export function launchApp(app: Pick<LaunchApp, "path" | "args" | "cwd" | "admin">): Promise<void> {
  return invoke("launch_app", { path: app.path, args: app.args, cwd: app.cwd, admin: app.admin });
}

/** Icônes (data URL PNG) des chemins, `null` quand Windows n'en donne pas. */
export function fetchIcons(paths: string[]): Promise<(string | null)[]> {
  return invoke("app_icons", { paths });
}

export async function fetchIcon(path: string): Promise<string> {
  try {
    return (await fetchIcons([path]))[0] ?? "";
  } catch {
    return "";
  }
}

// Inventaire gardé pour la session : le Store coûte plusieurs secondes (PowerShell).
let startMenu: Promise<InstalledApp[]> | null = null;
let store: Promise<InstalledApp[]> | null = null;

export function listStartMenuApps(refresh = false): Promise<InstalledApp[]> {
  if (refresh || !startMenu) {
    startMenu = invoke<InstalledApp[]>("list_start_menu_apps").catch((err) => {
      startMenu = null;
      throw err;
    });
  }
  return startMenu;
}

export function listStoreApps(refresh = false): Promise<InstalledApp[]> {
  if (refresh || !store) {
    store = invoke<InstalledApp[]>("list_store_apps").catch(() => {
      store = null;
      return [];
    });
  }
  return store;
}

const iconCache = new Map<string, string | null>();
const ICON_BATCH = 24;

/**
 * Icônes des chemins, chargées par lots (≈ 50 ms par icône) et gardées pour la session.
 * Renvoie la table chemin → icône, complétée au fil des lots.
 */
export function useIcons(paths: string[]): Map<string, string | null> {
  const [, setVersion] = useState(0);
  const key = paths.join("\n");

  useEffect(() => {
    let cancelled = false;
    const missing = paths.filter((p) => !iconCache.has(p));
    void (async () => {
      for (let i = 0; i < missing.length && !cancelled; i += ICON_BATCH) {
        const batch = missing.slice(i, i + ICON_BATCH);
        const icons = await fetchIcons(batch).catch(() => batch.map(() => null));
        batch.forEach((p, j) => iconCache.set(p, icons[j]));
        if (!cancelled) setVersion((v) => v + 1);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return iconCache;
}
