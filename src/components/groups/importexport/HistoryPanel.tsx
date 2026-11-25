import { useState, type ReactNode } from "react";
import { Button, Spinner } from "@heroui/react";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Ban, CheckCircle2, ChevronDown, ChevronRight, FolderOpen, History, Trash2, XCircle } from "lucide-react";
import { confirmDelete } from "@/lib/confirm";
import { durationBetween, errorMessage, formatBytes, formatDateTime, type IeSettings, type Run, type RunStatus } from "@/lib/importExport";
import { notify } from "@/lib/notify";
import { Badge } from "@/components/importexport/ui";

const STATUS: Record<RunStatus, { label: string; icon: ReactNode; cls: string }> = {
  running: { label: "En cours", icon: <Spinner size="sm" className="size-3.5" />, cls: "text-accent" },
  success: { label: "Réussi", icon: <CheckCircle2 className="size-3.5" />, cls: "text-success" },
  error: { label: "Échec", icon: <XCircle className="size-3.5" />, cls: "text-danger" },
  cancelled: { label: "Annulé", icon: <Ban className="size-3.5" />, cls: "text-muted" },
};

export function reveal(path: string) {
  revealItemInDir(path).catch((e) => notify({ title: "Fichier introuvable", body: errorMessage(e), kind: "alarm", durationMs: 6000 }));
}

/** Pas de données exportées alors que des tables existent (message préfixé par ⚠). */
export function isEmptyExport(run: Run) {
  return run.kind === "export" && run.status === "success" && run.message.startsWith("⚠");
}

/** Historique des exécutions du composant (exports et imports). */
export function HistoryPanel({ runs, settings, onClear }: { runs: Run[]; settings: IeSettings | null; onClear: () => void }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const envColor = (name: string) => settings?.environments.find((e) => e.name === name)?.color ?? "#64748b";

  async function clear() {
    if (await confirmDelete("Vider l'historique de ce composant ? Les fichiers produits ne sont pas supprimés.")) onClear();
  }

  if (runs.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-[0.8889rem] text-muted">
        <History className="size-8 opacity-40" />
        Aucune exécution pour l'instant.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-[0.8148rem] text-muted">{runs.length} exécution(s)</span>
        <Button className="ml-auto" size="sm" variant="ghost" onPress={() => void clear()}>
          <Trash2 className="size-3.5" />
          Vider
        </Button>
      </div>
      <ul className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {runs.map((r) => {
          const s = STATUS[r.status];
          const open = expanded === r.id;
          return (
            <li key={r.id} className="border-t border-separator first:border-t-0">
              <button
                type="button"
                onClick={() => setExpanded(open ? null : r.id)}
                className="flex w-full min-w-0 items-center gap-2 px-1 py-1.5 text-left text-[0.8889rem] hover:bg-surface-secondary"
              >
                <span className="text-muted">{open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}</span>
                {r.kind === "import" ? (
                  <ArrowDownToLine className="size-3.5 shrink-0 text-danger" aria-label="Import" />
                ) : (
                  <ArrowUpFromLine className="size-3.5 shrink-0 text-muted" aria-label="Export" />
                )}
                <span className="shrink-0 tabular-nums text-muted">{formatDateTime(r.startedAt)}</span>
                <Badge color={envColor(r.environmentName)}>{r.environmentName}</Badge>
                <span className="min-w-0 truncate font-medium">{r.connectorName}</span>
                {isEmptyExport(r) && <AlertTriangle className="size-3.5 shrink-0 text-warning" aria-label="Aucune donnée" />}
                <span className={`ml-auto flex shrink-0 items-center gap-1 ${s.cls}`}>
                  {s.icon}
                  {s.label}
                </span>
              </button>
              {open && <RunDetails run={r} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function RunDetails({ run }: { run: Run }) {
  return (
    <div className="mb-2 ml-6 flex flex-col gap-2 rounded-xl bg-surface-secondary p-2.5 text-[0.8148rem]">
      <div className="flex flex-wrap gap-x-4 text-muted">
        <span>{run.kind === "import" ? "Import" : "Export"}</span>
        <span>Durée : {durationBetween(run.startedAt, run.endedAt)}</span>
        {run.sizeBytes > 0 && <span>Taille : {formatBytes(run.sizeBytes)}</span>}
        {run.exitCode != null && <span>Code retour : {run.exitCode}</span>}
      </div>
      {run.files.length > 0 && (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-muted">{run.kind === "import" ? "Fichier importé" : "Fichiers"}</span>
          {run.files.map((f) => (
            <button key={f} type="button" title="Afficher dans l'explorateur" className="flex w-fit items-center gap-1.5 text-left font-mono break-all hover:underline" onClick={() => reveal(f)}>
              <FolderOpen className="size-3.5 shrink-0 text-muted" />
              {f}
            </button>
          ))}
        </div>
      )}
      {run.message && (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-muted">{run.status === "success" ? "Compte rendu" : "Message"}</span>
          <pre className={`font-mono break-all whitespace-pre-wrap ${run.status === "error" ? "text-danger" : ""}`}>{run.message}</pre>
        </div>
      )}
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-muted">Commande</span>
        <pre className="font-mono break-all whitespace-pre-wrap">{run.commandPreview}</pre>
      </div>
    </div>
  );
}
