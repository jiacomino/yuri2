/**
 * Import / Export MariaDB : types, appels au backend (`src-tauri/src/ie`), paramètres
 * partagés (Paramètres › Import / Export) et suivi des exécutions en cours.
 */
import { useEffect, useState, useSyncExternalStore } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { genId } from "@/lib/id";
import { notify } from "@/lib/notify";

// ---------------------------------------------------------------------------
// Types

export type SslMode = "default" | "disabled" | "required" | "verify";

export type IeApplication = { id: string; name: string; color: string; notes: string };
export type IeEnvironment = { id: string; name: string; color: string; confirm: boolean };
export type IeServer = {
  id: string;
  name: string;
  environmentId: string;
  host: string;
  port: number;
  user: string;
  /** En clair côté frontend, chiffré en base par le backend. */
  password: string;
  sslMode: SslMode;
  notes: string;
};

export type IeSettings = {
  dumpPath: string;
  clientPath: string;
  defaultOutputDir: string;
  applications: IeApplication[];
  environments: IeEnvironment[];
  servers: IeServer[];
};

export type DumpOptions = {
  singleTransaction: boolean;
  quick: boolean;
  routines: boolean;
  triggers: boolean;
  events: boolean;
  noData: boolean;
  noCreateInfo: boolean;
  addDropTable: boolean;
  addDropDatabase: boolean;
  createDatabase: boolean;
  completeInsert: boolean;
  extendedInsert: boolean;
  hexBlob: boolean;
  skipComments: boolean;
  lockTables: boolean;
  defaultCharacterSet: string;
};

export type Compress = "none" | "gzip";
export type OnExists = "suffix" | "overwrite" | "fail";

/** Réglages d'import mémorisés par connecteur (le fichier est choisi au lancement). */
export type ImportPrefs = {
  database: string;
  createDatabase: boolean;
  force: boolean;
  defaultCharacterSet: string;
  extraArgs: string;
};

export type IeConnector = {
  id: string;
  name: string;
  applicationId: string;
  environmentId: string;
  /** Couleur de l'onglet ; vide = couleur de l'environnement. */
  color: string;
  /** Serveur enregistré ; null = connexion propre au connecteur. */
  serverId: string | null;
  host: string;
  port: number;
  user: string;
  password: string;
  sslMode: SslMode;
  allDatabases: boolean;
  databases: string[];
  splitPerDatabase: boolean;
  tablesInclude: string[];
  tablesExclude: string[];
  options: DumpOptions;
  extraArgs: string;
  outputDir: string;
  filePattern: string;
  compress: Compress;
  onExists: OnExists;
  importPrefs: ImportPrefs;
};

export type ImportRequest = ImportPrefs & { file: string };

export type ConnSpec = Pick<IeConnector, "serverId" | "host" | "port" | "user" | "password" | "sslMode">;

export type DbInfo = { name: string; tables: number; rows: number; size: number };
export type Preview = { commands: string[]; files: string[]; error: string | null };

export type RunKind = "export" | "import";
export type RunStatus = "running" | "success" | "error" | "cancelled";

export type Run = {
  id: number;
  groupId: string;
  connectorId: string;
  connectorName: string;
  kind: RunKind;
  applicationName: string;
  environmentName: string;
  startedAt: string;
  endedAt: string | null;
  status: RunStatus;
  exitCode: number | null;
  files: string[];
  sizeBytes: number;
  commandPreview: string;
  message: string;
};

export type Progress = {
  runId: number;
  groupId: string;
  connectorId: string;
  kind: RunKind;
  jobIndex: number;
  jobCount: number;
  label: string;
  bytes: number;
  totalBytes: number;
  elapsedMs: number;
};

export type LiveRun = { runId: number; groupId: string; connectorId: string; kind: RunKind; progress: Progress | null };

// ---------------------------------------------------------------------------
// Valeurs par défaut

export const DEFAULT_OPTIONS: DumpOptions = {
  singleTransaction: true,
  quick: true,
  routines: true,
  triggers: true,
  events: false,
  noData: false,
  noCreateInfo: false,
  addDropTable: true,
  addDropDatabase: false,
  createDatabase: false,
  completeInsert: false,
  extendedInsert: true,
  hexBlob: true,
  skipComments: false,
  lockTables: false,
  defaultCharacterSet: "utf8mb4",
};

export const DEFAULT_IMPORT: ImportPrefs = {
  database: "",
  createDatabase: false,
  force: false,
  defaultCharacterSet: "utf8mb4",
  extraArgs: "",
};

export const EMPTY_SETTINGS: IeSettings = {
  dumpPath: "",
  clientPath: "",
  defaultOutputDir: "",
  applications: [],
  environments: [],
  servers: [],
};

export function newConnector(partial: Partial<IeConnector> = {}): IeConnector {
  return {
    id: genId(),
    name: "",
    applicationId: "",
    environmentId: "",
    color: "",
    serverId: null,
    host: "localhost",
    port: 3306,
    user: "",
    password: "",
    sslMode: "default",
    allDatabases: false,
    databases: [],
    splitPerDatabase: true,
    tablesInclude: [],
    tablesExclude: [],
    options: { ...DEFAULT_OPTIONS },
    extraArgs: "",
    outputDir: "",
    filePattern: "{app}_{env}_{db}_{date}",
    compress: "none",
    onExists: "suffix",
    importPrefs: { ...DEFAULT_IMPORT },
    ...partial,
  };
}

/** Complète un connecteur enregistré par une version antérieure (champs ajoutés depuis). */
export function normalizeConnector(c: Partial<IeConnector>): IeConnector {
  const base = newConnector();
  return {
    ...base,
    ...c,
    options: { ...DEFAULT_OPTIONS, ...c.options },
    importPrefs: { ...DEFAULT_IMPORT, ...c.importPrefs },
  } as IeConnector;
}

export function newServer(environmentId = ""): IeServer {
  return { id: genId(), name: "", environmentId, host: "", port: 3306, user: "", password: "", sslMode: "default", notes: "" };
}

export const SSL_MODES: { id: SslMode; label: string; hint: string }[] = [
  { id: "default", label: "Par défaut du client", hint: "Comportement du client MariaDB installé" },
  { id: "disabled", label: "Désactivé", hint: "--skip-ssl (serveur sans TLS)" },
  { id: "required", label: "Exigé", hint: "--ssl" },
  { id: "verify", label: "Exigé + vérifier le certificat", hint: "--ssl --ssl-verify-server-cert" },
];

// ---------------------------------------------------------------------------
// Appels backend

export const ieApi = {
  settingsGet: () => invoke<IeSettings>("ie_settings_get"),
  settingsSave: (settings: IeSettings) => invoke<void>("ie_settings_save", { settings }),
  checkBinary: (dumpPath: string, clientPath: string) =>
    invoke<{ version: string; clientPath: string }>("ie_check_binary", { dumpPath, clientPath }),
  test: (conn: ConnSpec) => invoke<string>("ie_test", { conn }),
  databases: (conn: ConnSpec) => invoke<DbInfo[]>("ie_databases", { conn }),
  preview: (connector: IeConnector) => invoke<Preview>("ie_preview", { connector }),
  importPreview: (connector: IeConnector, request: ImportRequest) =>
    invoke<string>("ie_import_preview", { connector, request }),
  exportRun: (groupId: string, connector: IeConnector) => invoke<number>("ie_export", { groupId, connector }),
  importRun: (groupId: string, connector: IeConnector, request: ImportRequest) =>
    invoke<number>("ie_import", { groupId, connector, request }),
  cancel: (runId: number) => invoke<void>("ie_cancel", { runId }),
  live: () => invoke<LiveRun[]>("ie_live"),
  runs: (groupId: string, limit?: number) => invoke<Run[]>("ie_runs", { groupId, limit }),
  runsClear: (groupId: string) => invoke<void>("ie_runs_clear", { groupId }),
};

export function errorMessage(e: unknown): string {
  return typeof e === "string" ? e : e instanceof Error ? e.message : JSON.stringify(e);
}

// ---------------------------------------------------------------------------
// Paramètres partagés (onglet des paramètres ↔ composants)

let settingsCache: IeSettings | null = null;
let settingsLoading: Promise<void> | null = null;
const settingsListeners = new Set<() => void>();

function emitSettings() {
  for (const l of settingsListeners) l();
}

function loadSettings() {
  settingsLoading ??= ieApi
    .settingsGet()
    .then((s) => {
      settingsCache = { ...EMPTY_SETTINGS, ...s };
    })
    .catch((e) => {
      settingsCache = { ...EMPTY_SETTINGS };
      notify({ title: "Paramètres d'import / export illisibles", body: errorMessage(e), kind: "alarm", durationMs: 8000 });
    })
    .finally(emitSettings);
  return settingsLoading;
}

/** Enregistre les paramètres et prévient tous les composants. */
export function saveIeSettings(next: IeSettings): Promise<void> {
  return updateIeSettings(() => ({ next, result: undefined }));
}

let saveQueue: Promise<unknown> = Promise.resolve();

/**
 * Modification appliquée aussitôt au cache (affichage immédiat, saisie au clavier
 * fluide), puis enregistrée en arrière-plan dans l'ordre des appels : plusieurs
 * composants peuvent modifier les paramètres en même temps sans écraser les
 * changements des autres. `fn` renvoie `next: null` pour ne rien enregistrer.
 * En cas d'échec d'enregistrement, les paramètres sont relus depuis la base.
 */
export async function updateIeSettings<R>(fn: (current: IeSettings) => { next: IeSettings | null; result: R }): Promise<R> {
  if (!settingsCache) await loadSettings();
  const { next, result } = fn(settingsCache ?? { ...EMPTY_SETTINGS });
  if (!next) return result;
  settingsCache = next;
  emitSettings();
  const save = saveQueue.then(() => ieApi.settingsSave(next));
  saveQueue = save.catch(() => undefined);
  try {
    await save;
  } catch (e) {
    settingsLoading = null;
    void loadSettings();
    throw e;
  }
  return result;
}

/** Derniers paramètres connus (null avant le premier chargement). */
export function peekIeSettings(): IeSettings | null {
  return settingsCache;
}

/** Charge les paramètres si besoin (hors React). */
export function ensureIeSettings(): Promise<IeSettings> {
  return settingsCache ? Promise.resolve(settingsCache) : loadSettings().then(() => settingsCache ?? { ...EMPTY_SETTINGS });
}

/** Paramètres d'import / export (null pendant le premier chargement). */
export function useIeSettings(): IeSettings | null {
  const value = useSyncExternalStore(
    (cb) => {
      settingsListeners.add(cb);
      return () => settingsListeners.delete(cb);
    },
    () => settingsCache,
  );
  useEffect(() => {
    if (!settingsCache) void loadSettings();
  }, []);
  return value;
}

// ---------------------------------------------------------------------------
// Exécutions en cours (écoute unique, partagée par tous les composants)

let liveRuns: LiveRun[] = [];
let liveStarted = false;
const liveListeners = new Set<() => void>();
/** Incrémenté à chaque fin d'exécution : les historiques se rechargent. */
let runsVersion = 0;

function emitLive() {
  for (const l of liveListeners) l();
}

function startLive() {
  if (liveStarted) return;
  liveStarted = true;
  void ieApi
    .live()
    .then((list) => {
      // Fusion : une exécution lancée entre-temps est déjà dans la liste.
      const known = new Set(liveRuns.map((l) => l.runId));
      liveRuns = [...liveRuns, ...list.filter((l) => !known.has(l.runId))];
      emitLive();
    })
    .catch(() => {});
  void listen<Progress>("ie://progress", ({ payload }) => {
    const exists = liveRuns.some((l) => l.runId === payload.runId);
    liveRuns = exists
      ? liveRuns.map((l) => (l.runId === payload.runId ? { ...l, progress: payload } : l))
      : [...liveRuns, { runId: payload.runId, groupId: payload.groupId, connectorId: payload.connectorId, kind: payload.kind, progress: payload }];
    emitLive();
  });
  void listen<Run | null>("ie://finished", ({ payload }) => {
    runsVersion++;
    if (payload) {
      liveRuns = liveRuns.filter((l) => l.runId !== payload.id);
      const what = payload.kind === "import" ? "Import" : "Export";
      const title = `${payload.applicationName} · ${payload.environmentName} · ${payload.connectorName}`;
      if (payload.status === "success") {
        const detail =
          payload.kind === "import"
            ? payload.message
            : `${payload.files.length} fichier(s), ${formatBytes(payload.sizeBytes)}`;
        notify({ title: `${what} terminé`, body: `${title} — ${detail}`, kind: "success" });
      } else if (payload.status === "cancelled") {
        notify({ title: `${what} annulé`, body: title });
      } else {
        notify({ title: `Échec de l'${what.toLowerCase()} — ${title}`, body: payload.message, kind: "alarm", durationMs: 12000 });
      }
    } else {
      // Fin non enregistrée (base verrouillée) : resynchronise depuis le backend.
      void ieApi.live().then((list) => {
        liveRuns = list;
        emitLive();
      });
    }
    emitLive();
  });
}

/** Ajoute une exécution tout juste lancée (avant son premier événement de progression). */
export function trackRun(run: LiveRun) {
  if (!liveRuns.some((l) => l.runId === run.runId)) {
    liveRuns = [...liveRuns, run];
    emitLive();
  }
}

/** Exécutions en cours d'un composant, et version de l'historique. */
export function useLiveRuns(groupId: string): { live: LiveRun[]; runsVersion: number } {
  const [, force] = useState(0);
  useEffect(() => {
    startLive();
    const l = () => force((n) => n + 1);
    liveListeners.add(l);
    return () => {
      liveListeners.delete(l);
    };
  }, []);
  return { live: liveRuns.filter((l) => l.groupId === groupId), runsVersion };
}

// ---------------------------------------------------------------------------
// Formatage

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} o`;
  const units = ["Ko", "Mo", "Go", "To"];
  let v = n / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toLocaleString("fr-FR", { maximumFractionDigits: v < 10 ? 1 : 0 })} ${units[i]}`;
}

export function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ${String(s % 60).padStart(2, "0")} s`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")} min`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function durationBetween(start: string, end: string | null): string {
  if (!end) return "—";
  return formatDuration(new Date(end).getTime() - new Date(start).getTime());
}

export function fileName(path: string): string {
  return path.split(/[\\/]/).pop() ?? path;
}
