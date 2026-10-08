import { genId } from "@/lib/id";

/**
 * Application à lancer : tout ce que `ShellExecute` accepte (programme, raccourci, document,
 * dossier, `shell:AppsFolder\…` pour le Store, URI comme `ms-settings:`). Les `%VARIABLES%`
 * d'environnement sont développées au lancement.
 */
export type LaunchApp = {
  id: string;
  name: string;
  path: string;
  /** Arguments de la ligne de commande. */
  args: string;
  /** Dossier de travail, vide = celui par défaut. */
  cwd: string;
  /** Lancer en administrateur (invite UAC). */
  admin: boolean;
  /** Icône extraite par Windows (data URL PNG), vide si aucune. */
  icon: string;
  launchCount: number;
  lastLaunchedAt: number | null;
};

export type LauncherView = "grid" | "list";

export type LauncherState = { apps: LaunchApp[]; view: LauncherView };

export function defaultState(): LauncherState {
  return { apps: [], view: "grid" };
}

export function demoState(): LauncherState {
  const app = (name: string, path: string): LaunchApp => ({ ...newApp(name, path), id: name });
  return {
    view: "grid",
    apps: [
      app("Bloc-notes", "%windir%\\notepad.exe"),
      app("Explorateur", "%windir%\\explorer.exe"),
      app("Calculatrice", "calc.exe"),
      app("Paramètres", "ms-settings:"),
      { ...app("Invite de commandes", "%windir%\\system32\\cmd.exe"), cwd: "%USERPROFILE%" },
    ],
  };
}

export function newApp(name: string, path: string, icon = ""): LaunchApp {
  return {
    id: genId(),
    name: name.trim() || nameFromPath(path),
    path: path.trim(),
    args: "",
    cwd: "",
    admin: false,
    icon,
    launchCount: 0,
    lastLaunchedAt: null,
  };
}

/** Nom lisible tiré d'un chemin : « C:\…\Code.exe » → « Code ». */
export function nameFromPath(path: string): string {
  const last = path.trim().replace(/[\\/]+$/, "").split(/[\\/]/).pop() ?? "";
  return last.replace(/\.(exe|lnk|url|bat|cmd|appref-ms)$/i, "") || path.trim();
}

/** Vrai pour un chemin absolu, qu'on peut montrer dans l'Explorateur. */
export function isFilePath(path: string): boolean {
  return /^([a-z]:[\\/]|\\\\)/i.test(path.trim());
}
