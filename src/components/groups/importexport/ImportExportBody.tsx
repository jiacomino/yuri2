import { useEffect, useState, type ReactNode } from "react";
import { Button, Dropdown, Label, Spinner } from "@heroui/react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Copy,
  DatabaseZap,
  Ellipsis,
  FileCode2,
  FolderOutput,
  History,
  Pencil,
  Play,
  Plus,
  Server as ServerIcon,
  Settings2,
  Square,
  Trash2,
  XCircle,
} from "lucide-react";
import { Badge, ConfirmDialog } from "@/components/importexport/ui";
import { confirmDelete } from "@/lib/confirm";
import { genId } from "@/lib/id";
import {
  errorMessage,
  fileName,
  formatBytes,
  formatDateTime,
  formatDuration,
  ieApi,
  newConnector,
  trackRun,
  useIeSettings,
  useLiveRuns,
  type IeConnector,
  type IeSettings,
  type ImportRequest,
  type LiveRun,
  type Run,
} from "@/lib/importExport";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";
import type { BodyProps } from "../types";
import { ConnectorEditor } from "./ConnectorEditor";
import { HistoryPanel, isEmptyExport, reveal } from "./HistoryPanel";
import { ImportDialog } from "./ImportDialog";
import { connectorsOf, type ImportExportState } from "./state";

/** Corps du groupe « Import / Export » : un onglet par connecteur, export et import MariaDB. */
export function ImportExportBody({ groupId, value, onChange }: BodyProps<ImportExportState>) {
  const settings = useIeSettings();
  const connectors = connectorsOf(value);
  const active = connectors.find((c) => c.id === value.activeId) ?? connectors[0];
  const { live, runsVersion } = useLiveRuns(groupId);
  const [runs, setRuns] = useState<Run[]>([]);
  const [editing, setEditing] = useState<{ connector: IeConnector; isNew: boolean } | null>(null);
  const [confirming, setConfirming] = useState<IeConnector | null>(null);
  const [importing, setImporting] = useState<IeConnector | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    ieApi.runs(groupId, 200).then(setRuns).catch(() => setRuns([]));
  }, [groupId, runsVersion, live.length]);

  const liveOf = (c: IeConnector) => live.find((l) => l.connectorId === c.id);
  const lastRunOf = (c: IeConnector) => runs.find((r) => r.connectorId === c.id && r.status !== "running");
  const lastExportFile = (c: IeConnector) => runs.find((r) => r.connectorId === c.id && r.kind === "export" && r.status === "success")?.files[0] ?? "";

  function setConnectors(list: IeConnector[], activeId: string | null = value.activeId) {
    onChange({ connectors: list, activeId: list.some((c) => c.id === activeId) ? activeId : (list[0]?.id ?? null) });
  }

  function saveConnector(c: IeConnector, isNew: boolean) {
    if (isNew) setConnectors([...connectors, c], c.id);
    else setConnectors(connectors.map((x) => (x.id === c.id ? c : x)));
  }

  function addConnector() {
    const env = settings?.environments[0];
    const server = settings?.servers.find((s) => s.environmentId === env?.id);
    setEditing({
      connector: newConnector({ applicationId: settings?.applications[0]?.id ?? "", environmentId: env?.id ?? "", serverId: server?.id ?? null }),
      isNew: true,
    });
  }

  function duplicate(c: IeConnector) {
    const copy = { ...structuredClone(c), id: genId(), name: `${c.name} (copie)` };
    const i = connectors.findIndex((x) => x.id === c.id);
    setConnectors([...connectors.slice(0, i + 1), copy, ...connectors.slice(i + 1)], copy.id);
  }

  async function remove(c: IeConnector) {
    if (liveOf(c)) return;
    if (await confirmDelete(`Supprimer le connecteur « ${c.name} » et son mot de passe ? L'historique est conservé.`)) {
      setConnectors(connectors.filter((x) => x.id !== c.id));
    }
  }

  async function startExport(c: IeConnector) {
    try {
      const runId = await ieApi.exportRun(groupId, c);
      trackRun({ runId, groupId, connectorId: c.id, kind: "export", progress: null });
    } catch (e) {
      notify({ title: `Impossible de lancer « ${c.name} »`, body: errorMessage(e), kind: "alarm", durationMs: 10000 });
    }
  }

  async function startImport(c: IeConnector, request: ImportRequest) {
    const { file: _file, ...importPrefs } = request;
    saveConnector({ ...c, importPrefs }, false);
    try {
      const runId = await ieApi.importRun(groupId, c, request);
      trackRun({ runId, groupId, connectorId: c.id, kind: "import", progress: null });
    } catch (e) {
      notify({ title: `Impossible d'importer dans « ${c.name} »`, body: errorMessage(e), kind: "alarm", durationMs: 10000 });
    }
  }

  const hasTools = !!settings && !!(settings.dumpPath || settings.clientPath);
  const confirmEnv = confirming ? settings?.environments.find((e) => e.id === confirming.environmentId) : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Onglets = connecteurs. */}
      <div className="flex shrink-0 items-center gap-3 border-b border-separator">
        <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto">
          {connectors.map((c) => {
            const env = settings?.environments.find((e) => e.id === c.environmentId);
            const selected = c.id === active?.id && !showHistory;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onChange({ ...value, activeId: c.id });
                  setShowHistory(false);
                }}
                onDoubleClick={() => settings && setEditing({ connector: c, isNew: false })}
                title={`${c.name}${env ? ` — ${env.name}` : ""} (double-clic pour modifier)`}
                className={cn(
                  "relative flex shrink-0 items-center gap-1.5 py-2 text-[0.963rem] font-semibold transition-colors",
                  selected ? "text-accent" : "text-muted hover:text-foreground",
                )}
              >
                <span className="size-1.5 shrink-0 rounded-full" style={{ background: c.color || env?.color || "var(--muted)" }} />
                <span className="max-w-40 truncate">{c.name || "Sans nom"}</span>
                {liveOf(c) && <Spinner size="sm" className="size-3" />}
                {selected && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent" />}
              </button>
            );
          })}
          {connectors.length === 0 && <span className="py-2 text-xs text-muted">Aucun connecteur</span>}
        </div>
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          aria-label="Nouveau connecteur"
          onPress={addConnector}
          isDisabled={!settings}
          className="size-7 min-w-7 rounded-lg text-muted hover:text-foreground"
        >
          <Plus className="size-3.5" />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          aria-label="Historique"
          aria-pressed={showHistory}
          onPress={() => setShowHistory((s) => !s)}
          className={cn("size-7 min-w-7 rounded-lg hover:text-foreground", showHistory ? "bg-accent/12 text-accent" : "text-muted")}
        >
          <History className="size-3.5" />
        </Button>
        {active && (
          <Dropdown>
            <Button isIconOnly size="sm" variant="ghost" aria-label="Actions du connecteur" className="size-7 min-w-7 rounded-lg text-muted hover:text-foreground">
              <Ellipsis className="size-3.5" />
            </Button>
            <Dropdown.Popover placement="bottom end" className="min-w-52">
              <Dropdown.Menu
                aria-label="Actions du connecteur"
                disabledKeys={liveOf(active) ? ["delete", "import"] : []}
                onAction={(key) => {
                  if (key === "edit" && settings) setEditing({ connector: active, isNew: false });
                  else if (key === "import") setImporting(active);
                  else if (key === "duplicate") duplicate(active);
                  else if (key === "delete") void remove(active);
                }}
              >
                <Dropdown.Item id="edit" textValue="Modifier le connecteur">
                  <Pencil className="size-3.5" />
                  <Label>Modifier le connecteur…</Label>
                </Dropdown.Item>
                <Dropdown.Item id="import" textValue="Importer un dump">
                  <DatabaseZap className="size-3.5" />
                  <Label>Importer un dump…</Label>
                </Dropdown.Item>
                <Dropdown.Item id="duplicate" textValue="Dupliquer le connecteur">
                  <Copy className="size-3.5" />
                  <Label>Dupliquer le connecteur</Label>
                </Dropdown.Item>
                <Dropdown.Item id="delete" textValue="Supprimer le connecteur" variant="danger">
                  <Trash2 className="size-3.5" />
                  <Label>Supprimer le connecteur</Label>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        )}
      </div>

      {settings && !hasTools && (
        <p className="mt-2 flex items-center gap-2 rounded-[10px] bg-warning/10 px-3 py-1.5 text-[0.8148rem] text-warning">
          <Settings2 className="size-3.5 shrink-0" />
          Renseignez les outils MariaDB dans Paramètres › Import / Export.
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col pt-2">
        {showHistory ? (
          <HistoryPanel
            runs={runs}
            settings={settings}
            onClear={() =>
              void ieApi
                .runsClear(groupId)
                .then(() => ieApi.runs(groupId, 200).then(setRuns))
                .catch((e) => notify({ title: "Purge impossible", body: errorMessage(e), kind: "alarm" }))
            }
          />
        ) : !settings ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner size="sm" />
          </div>
        ) : active ? (
          <ConnectorView
            c={active}
            settings={settings}
            live={liveOf(active)}
            lastRun={lastRunOf(active)}
            canRun={hasTools}
            onRun={() => setConfirming(active)}
            onImport={() => setImporting(active)}
            onCancel={(runId) => void ieApi.cancel(runId).catch((e) => notify({ title: "Annulation impossible", body: errorMessage(e), kind: "alarm" }))}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-[0.8889rem] text-muted">
            Aucun connecteur dans ce composant.
            <Button size="sm" variant="secondary" onPress={addConnector}>
              <Plus className="size-3.5" />
              Ajouter un connecteur
            </Button>
          </div>
        )}
      </div>

      {settings && (
        <>
          <ConnectorEditor
            connector={editing?.connector ?? null}
            isNew={!!editing?.isNew}
            settings={settings}
            onSave={(c) => editing && saveConnector(c, editing.isNew)}
            onClose={() => setEditing(null)}
          />
          <ImportDialog
            connector={importing}
            settings={settings}
            defaultFile={importing ? lastExportFile(importing) : ""}
            onRun={(req) => importing && void startImport(importing, req)}
            onClose={() => setImporting(null)}
          />
          <ConfirmDialog
            isOpen={!!confirming}
            title={confirmEnv?.confirm ? "Export sur un environnement sensible" : "Lancer l'export ?"}
            confirmLabel="Lancer l'export"
            danger={!!confirmEnv?.confirm}
            typeToConfirm={confirmEnv?.confirm ? confirmEnv.name : undefined}
            onConfirm={() => confirming && void startExport(confirming)}
            onClose={() => setConfirming(null)}
          >
            {confirming && <RunSummary c={confirming} settings={settings} />}
          </ConfirmDialog>
        </>
      )}
    </div>
  );
}

/** Contenu de l'onglet actif : connexion, bases, sortie, derniers fichiers, lancement. */
function ConnectorView({
  c,
  settings,
  live,
  lastRun,
  canRun,
  onRun,
  onImport,
  onCancel,
}: {
  c: IeConnector;
  settings: IeSettings;
  live?: LiveRun;
  lastRun?: Run;
  canRun: boolean;
  onRun: () => void;
  onImport: () => void;
  onCancel: (runId: number) => void;
}) {
  const env = settings.environments.find((e) => e.id === c.environmentId);
  const app = settings.applications.find((a) => a.id === c.applicationId);
  const server = c.serverId != null ? settings.servers.find((s) => s.id === c.serverId) : undefined;
  const host = server ? server.host : c.host;
  const port = server ? server.port : c.port;
  const user = server ? server.user : c.user;
  const dbs = c.allDatabases ? ["toutes les bases"] : c.databases;
  const out = c.outputDir || settings.defaultOutputDir;
  const lastFiles = lastRun?.kind === "export" && lastRun.status === "success" ? lastRun.files : [];
  const progress = live?.progress;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto text-[0.8889rem]">
      <div className="flex flex-wrap items-center gap-1.5">
        {app && <span className="font-semibold">{app.name}</span>}
        {env ? <Badge color={env.color}>{env.name}</Badge> : <span className="text-warning">Environnement manquant</span>}
        {c.options.noData && <span className="rounded-md bg-warning/15 px-1.5 text-[0.7407rem] font-semibold text-warning">structure seule</span>}
        {c.compress === "gzip" && <span className="rounded-md bg-default px-1.5 text-[0.7407rem] font-semibold text-muted">gzip</span>}
      </div>
      <div className="flex min-w-0 items-center gap-1.5 text-muted" title={server ? `Serveur « ${server.name} »` : "Connexion propre au connecteur"}>
        <ServerIcon className="size-3.5 shrink-0" />
        {c.serverId != null && !server ? (
          <span className="text-warning">Serveur introuvable (supprimé des paramètres ?)</span>
        ) : (
          <>
            <span className="truncate font-mono text-[0.8148rem]">
              {user ? `${user}@` : ""}
              {host}:{port}
            </span>
            {server && <span className="shrink-0 rounded-md bg-default px-1.5 text-[0.7407rem] font-semibold">{server.name}</span>}
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {dbs.length ? (
          dbs.map((d) => (
            <span key={d} className="rounded-md bg-default px-1.5 py-px font-mono text-[0.8148rem]">
              {d}
            </span>
          ))
        ) : (
          <span className="text-warning">Aucune base sélectionnée</span>
        )}
      </div>
      {out && (
        <div className="flex min-w-0 items-center gap-1.5 text-muted" title={out}>
          <FolderOutput className="size-3.5 shrink-0" />
          <span className="truncate text-[0.8148rem]">{out}</span>
        </div>
      )}

      {lastFiles.length > 0 && !live && (
        <div className="flex flex-col gap-0.5">
          {lastFiles.slice(0, 4).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => reveal(f)}
              title={`Afficher dans l'explorateur : ${f}`}
              className="flex min-w-0 items-center gap-1.5 text-left text-[0.8148rem] font-medium text-accent hover:underline"
            >
              <FileCode2 className="size-3.5 shrink-0" />
              <span className="truncate">{fileName(f)}</span>
            </button>
          ))}
          {lastFiles.length > 4 && <span className="text-[0.7407rem] text-muted">+ {lastFiles.length - 4} autre(s) (voir l'historique)</span>}
        </div>
      )}

      <div className="mt-auto flex items-end gap-2 pt-1">
        <div className="min-w-0 flex-1">
          {live ? (
            <LiveStatus live={live} />
          ) : (
            lastRun && <LastRun run={lastRun} />
          )}
          {live && progress && live.kind === "import" && progress.totalBytes > 0 && (
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-default">
              <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${Math.min(100, (progress.bytes / progress.totalBytes) * 100)}%` }} />
            </div>
          )}
        </div>
        {live ? (
          <Button size="sm" variant="danger" onPress={() => onCancel(live.runId)}>
            <Square className="size-3.5" />
            Annuler
          </Button>
        ) : (
          <>
            <Button size="sm" variant="ghost" onPress={onImport} isDisabled={!canRun}>
              <DatabaseZap className="size-3.5" />
              Importer…
            </Button>
            <Button size="sm" variant="secondary" onPress={onRun} isDisabled={!canRun}>
              <Play className="size-3.5" />
              Exporter
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function LiveStatus({ live }: { live: LiveRun }) {
  const p = live.progress;
  const verb = live.kind === "import" ? "Import" : "Export";
  let text = `${verb} : démarrage…`;
  if (p) {
    const step = p.jobCount > 1 ? `${p.jobIndex + 1}/${p.jobCount} · ` : "";
    const amount =
      live.kind === "import" && p.totalBytes > 0
        ? `${formatBytes(p.bytes)} / ${formatBytes(p.totalBytes)}`
        : formatBytes(p.bytes);
    text = `${verb} · ${step}${p.label} · ${amount} · ${formatDuration(p.elapsedMs)}`;
  }
  return (
    <div className="flex items-center gap-1.5 font-medium text-accent">
      <Spinner size="sm" />
      <span className="truncate tabular-nums">{text}</span>
    </div>
  );
}

function LastRun({ run }: { run: Run }) {
  const empty = isEmptyExport(run);
  const icon =
    run.status === "success" ? (
      empty ? (
        <AlertTriangle className="size-3.5 text-warning" />
      ) : (
        <CheckCircle2 className="size-3.5 text-success" />
      )
    ) : run.status === "error" ? (
      <XCircle className="size-3.5 text-danger" />
    ) : (
      <Ban className="size-3.5 text-muted" />
    );
  return (
    <div className={cn("flex min-w-0 items-center gap-1.5 text-[0.8148rem]", empty ? "text-warning" : "text-muted")} title={run.message || undefined}>
      {icon}
      <span className="truncate tabular-nums">
        {run.kind === "import" ? "Import" : "Export"} · {formatDateTime(run.startedAt)}
        {run.status === "success" && run.kind === "export" && ` · ${formatBytes(run.sizeBytes)}`}
        {empty && " · aucune donnée"}
      </span>
    </div>
  );
}

/** Récapitulatif affiché dans la confirmation d'export. */
function RunSummary({ c, settings }: { c: IeConnector; settings: IeSettings }) {
  const env = settings.environments.find((e) => e.id === c.environmentId);
  const app = settings.applications.find((a) => a.id === c.applicationId);
  const server = c.serverId != null ? settings.servers.find((s) => s.id === c.serverId) : undefined;
  const rows: [string, ReactNode][] = [
    ["Connecteur", <strong>{c.name}</strong>],
    ["Application", app?.name ?? "—"],
    ["Environnement", <strong style={{ color: env?.color }}>{env?.name ?? "—"}</strong>],
    ["Serveur", `${server ? `${server.name} — ` : ""}${server?.host ?? c.host}:${server?.port ?? c.port}`],
    ["Bases", c.allDatabases ? "toutes" : c.databases.join(", ") || "—"],
    ["Sortie", c.outputDir || settings.defaultOutputDir || "—"],
    ["Contenu", c.options.noData ? "Structure seule (--no-data)" : c.options.noCreateInfo ? "Données seules (--no-create-info)" : "Structure + données"],
  ];
  return (
    <div className="flex flex-col gap-3">
      {env?.confirm && <p className="rounded-[10px] bg-danger/10 px-3 py-2 font-medium text-danger">Attention : environnement marqué « sensible ».</p>}
      {c.options.noData && (
        <p className="rounded-[10px] bg-warning/10 px-3 py-2 font-medium text-warning">L'option --no-data est cochée : seule la structure sera exportée, sans aucune donnée.</p>
      )}
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted">{k}</dt>
            <dd className="min-w-0 truncate">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
