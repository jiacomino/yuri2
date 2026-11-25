import { useEffect, useState } from "react";
import { Button, Modal, Spinner } from "@heroui/react";
import { AlertTriangle, CheckCircle2, Copy, Database, PlugZap, Server as ServerIcon, XCircle } from "lucide-react";
import { ConnectionFields } from "@/components/importexport/ConnectionFields";
import { CheckOption, Notice, PathInput, SectionTitle, SelectBox, TagListInput, TextInput, Toggle } from "@/components/importexport/ui";
import { ColorSwatches } from "@/components/shared/ColorSwatches";
import {
  errorMessage,
  ieApi,
  SSL_MODES,
  type DbInfo,
  type DumpOptions,
  type IeConnector,
  type IeSettings,
  type Preview,
} from "@/lib/importExport";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { DatabasePicker } from "./DatabasePicker";

type Props = {
  /** Connecteur à éditer (nouveau ou existant), null = fermé. */
  connector: IeConnector | null;
  isNew: boolean;
  settings: IeSettings;
  onSave: (c: IeConnector) => void;
  onClose: () => void;
};

/** Éditeur complet d'un connecteur : général, connexion, contenu, options, sortie, aperçu. */
export function ConnectorEditor({ connector, isNew, settings, onSave, onClose }: Props) {
  return (
    <Modal.Backdrop isOpen={!!connector} onOpenChange={(o) => !o && onClose()} isDismissable={false}>
      <Modal.Container size="lg" scroll="inside">
        <Modal.Dialog aria-label="Connecteur" className="h-[min(60rem,90vh)] w-[min(60rem,94vw)] max-w-none">
          {connector && <EditorForm initial={connector} isNew={isNew} settings={settings} onSave={onSave} onClose={onClose} />}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function EditorForm({ initial, isNew, settings, onSave, onClose }: { initial: IeConnector; isNew: boolean; settings: IeSettings; onSave: (c: IeConnector) => void; onClose: () => void }) {
  const { applications, environments, servers } = settings;
  const [draft, setDraft] = useState<IeConnector>(initial);
  const [test, setTest] = useState<{ state: "idle" | "running" | "ok" | "error"; text?: string }>({ state: "idle" });
  const [preview, setPreview] = useState<Preview | null>(null);

  const patch = (p: Partial<IeConnector>) => setDraft((d) => ({ ...d, ...p }));
  const patchOpt = (p: Partial<DumpOptions>) => setDraft((d) => ({ ...d, options: { ...d.options, ...p } }));

  // Aperçu recalculé (avec un léger délai) à chaque modification.
  useEffect(() => {
    const t = setTimeout(() => {
      ieApi.preview(draft).then(setPreview).catch(() => setPreview(null));
    }, 250);
    return () => clearTimeout(t);
  }, [draft]);

  // Une modification de connexion invalide le dernier test.
  useEffect(() => setTest({ state: "idle" }), [draft.host, draft.port, draft.user, draft.password, draft.sslMode, draft.serverId]);

  const envServers = servers.filter((s) => s.environmentId === draft.environmentId);
  const server = draft.serverId != null ? servers.find((s) => s.id === draft.serverId) : undefined;
  const app = applications.find((a) => a.id === draft.applicationId);
  const env = environments.find((e) => e.id === draft.environmentId);
  const hasTools = !!(settings.dumpPath || settings.clientPath);

  async function runTest() {
    setTest({ state: "running" });
    try {
      setTest({ state: "ok", text: await ieApi.test(draft) });
    } catch (e) {
      setTest({ state: "error", text: errorMessage(e) });
    }
  }

  const missing: string[] = [];
  if (!draft.name.trim()) missing.push("nom");
  if (!app) missing.push("application");
  if (!env) missing.push("environnement");
  if (draft.serverId != null && !server) missing.push("serveur");

  return (
    <>
      <Modal.CloseTrigger />
      <Modal.Header>
        <Modal.Heading>{isNew ? "Nouveau connecteur" : `Connecteur « ${initial.name} »`}</Modal.Heading>
        <p className="text-[0.8889rem] text-muted">{[app?.name, env?.name].filter(Boolean).join(" · ") || "Choisissez une application et un environnement"}</p>
      </Modal.Header>

      <Modal.Body className="flex min-h-0 flex-1 flex-col gap-4 py-4">
        <SectionTitle first>Général</SectionTitle>
        <TextInput label="Nom du connecteur" value={draft.name} onChange={(name) => patch({ name })} isRequired autoFocus placeholder="ex. Base principale" />
        <div className="grid grid-cols-2 gap-4">
          <SelectBox
            label="Application"
            value={draft.applicationId || null}
            onChange={(applicationId) => patch({ applicationId })}
            items={applications.map((a) => ({ id: a.id, label: a.name, color: a.color }))}
            placeholder={applications.length ? "Choisir…" : "Créez une application (Paramètres)"}
          />
          <SelectBox
            label="Environnement"
            value={draft.environmentId || null}
            onChange={(environmentId) => patch({ environmentId })}
            items={environments.map((e) => ({ id: e.id, label: e.name, color: e.color }))}
            placeholder={environments.length ? "Choisir…" : "Créez un environnement (Paramètres)"}
          />
        </div>
        {(applications.length === 0 || environments.length === 0) && (
          <Notice tone="warning" icon={<AlertTriangle className="size-4" />}>
            Les applications et environnements se définissent dans Paramètres › Import / Export.
          </Notice>
        )}
        {env?.confirm && (
          <Notice tone="warning" icon={<AlertTriangle className="size-4" />}>
            Environnement sensible : son nom devra être recopié avant chaque export ou import.
          </Notice>
        )}
        <div className="flex flex-col gap-2">
          <span className="text-[0.963rem] font-medium">Couleur de l'onglet</span>
          <ColorSwatches value={draft.color || null} onChange={(color) => patch({ color: color ?? "" })} allowNone />
          <span className="text-[0.8148rem] text-muted">Sans couleur, l'onglet prend celle de l'environnement.</span>
        </div>

        <SectionTitle>Connexion</SectionTitle>
        <div className="flex gap-1 rounded-[12px] bg-default p-1" role="radiogroup" aria-label="Type de connexion">
          {(
            [
              { id: "server", label: "Serveur enregistré", icon: <ServerIcon className="size-3.5" /> },
              { id: "custom", label: "Connexion spécifique", icon: <PlugZap className="size-3.5" /> },
            ] as const
          ).map((m) => {
            const selected = (m.id === "server") === (draft.serverId != null);
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => (m.id === "server" ? patch({ serverId: envServers[0]?.id ?? servers[0]?.id ?? null }) : patch({ serverId: null }))}
                disabled={m.id === "server" && servers.length === 0}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-[9px] py-1.5 text-[0.963rem] font-semibold transition-colors disabled:opacity-40",
                  selected ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground",
                )}
              >
                {m.icon}
                {m.label}
              </button>
            );
          })}
        </div>
        {servers.length === 0 && <p className="-mt-2 text-[0.8148rem] text-muted">Aucun serveur enregistré : ajoutez-en dans Paramètres › Import / Export pour les réutiliser.</p>}

        {draft.serverId != null ? (
          <>
            <SelectBox
              label="Serveur"
              value={draft.serverId}
              onChange={(serverId) => patch({ serverId })}
              items={[...envServers, ...servers.filter((s) => s.environmentId !== draft.environmentId)].map((s) => {
                const e = environments.find((x) => x.id === s.environmentId);
                return { id: s.id, label: `${s.name} — ${e?.name ?? "?"} (${s.host}:${s.port})`, color: e?.color };
              })}
            />
            {server && (
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 rounded-[12px] bg-surface-secondary p-3 text-[0.8889rem]">
                <span className="text-muted">Hôte</span>
                <span className="font-mono">
                  {server.host}:{server.port}
                </span>
                <span className="text-muted">Utilisateur</span>
                <span className="font-mono">{server.user || "—"}</span>
                <span className="text-muted">Mot de passe</span>
                <span>{server.password ? "enregistré (chiffré)" : "aucun"}</span>
                <span className="text-muted">SSL</span>
                <span>{SSL_MODES.find((m) => m.id === server.sslMode)?.label}</span>
              </div>
            )}
            {server && server.environmentId !== draft.environmentId && (
              <Notice tone="warning" icon={<AlertTriangle className="size-4" />}>
                Ce serveur appartient à un autre environnement que le connecteur.
              </Notice>
            )}
          </>
        ) : (
          <ConnectionFields value={draft} onChange={patch} />
        )}

        <div className="flex flex-col gap-2">
          <div>
            <Button size="sm" variant="secondary" onPress={() => void runTest()} isDisabled={test.state === "running" || !hasTools}>
              {test.state === "running" ? <Spinner size="sm" /> : <PlugZap className="size-4" />}
              Tester la connexion
            </Button>
          </div>
          {!hasTools && <Notice tone="warning">Configurez d'abord les outils MariaDB dans Paramètres › Import / Export.</Notice>}
          {test.state === "ok" && (
            <Notice tone="success" icon={<CheckCircle2 className="size-4" />}>
              {test.text}
            </Notice>
          )}
          {test.state === "error" && (
            <Notice tone="danger" icon={<XCircle className="size-4" />}>
              <pre className="font-sans whitespace-pre-wrap">{test.text}</pre>
            </Notice>
          )}
        </div>

        <SectionTitle>Contenu</SectionTitle>
        <ContentSection draft={draft} patch={patch} />

        <SectionTitle>Options mariadb-dump</SectionTitle>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
          {OPTION_DEFS.map((o) => (
            <CheckOption
              key={o.key}
              label={<code className="text-[0.8889rem]">{o.flag}</code>}
              hint={o.hint}
              isSelected={draft.options[o.key]}
              onChange={(v) => patchOpt({ [o.key]: v } as Partial<DumpOptions>)}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextInput
            label="Jeu de caractères"
            value={draft.options.defaultCharacterSet}
            onChange={(defaultCharacterSet) => patchOpt({ defaultCharacterSet })}
            placeholder="(défaut du serveur)"
            description="--default-character-set"
          />
        </div>
        <TextInput
          label="Arguments supplémentaires"
          value={draft.extraArgs}
          onChange={(extraArgs) => patch({ extraArgs })}
          placeholder='ex. --max-allowed-packet=1G --where="created_at > 2024-01-01"'
          inputClassName="font-mono text-xs"
          description="Ajoutés tels quels ; guillemets acceptés pour les valeurs avec espaces."
        />

        <SectionTitle>Sortie</SectionTitle>
        <PathInput
          label="Répertoire de sortie"
          value={draft.outputDir}
          onChange={(outputDir) => patch({ outputDir })}
          placeholder={settings.defaultOutputDir ? `Par défaut : ${settings.defaultOutputDir}` : "Aucun répertoire par défaut"}
          description="Vide = celui des paramètres. Variables acceptées (ex. D:\Dumps\{app}\{env})."
          directory
        />
        <TextInput
          label="Nom du fichier"
          value={draft.filePattern}
          onChange={(filePattern) => patch({ filePattern })}
          inputClassName="font-mono text-xs"
          description="Extension .sql (et .gz) ajoutée automatiquement."
        />
        <div className="flex flex-wrap gap-1.5">
          {VARIABLES.map((v) => (
            <button
              key={v.token}
              type="button"
              title={v.hint}
              onClick={() => patch({ filePattern: draft.filePattern + v.token })}
              className="rounded-md bg-default px-1.5 py-0.5 font-mono text-[0.8148rem] hover:bg-accent/15"
            >
              {v.token}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <SelectBox
            label="Compression"
            value={draft.compress}
            onChange={(v) => patch({ compress: v as IeConnector["compress"] })}
            items={[
              { id: "none", label: "Aucune (.sql)" },
              { id: "gzip", label: "gzip (.sql.gz)" },
            ]}
          />
          <SelectBox
            label="Si le fichier existe"
            value={draft.onExists}
            onChange={(v) => patch({ onExists: v as IeConnector["onExists"] })}
            items={[
              { id: "suffix", label: "Ajouter un suffixe (_1, _2…)" },
              { id: "overwrite", label: "Écraser" },
              { id: "fail", label: "Échouer" },
            ]}
          />
        </div>
        <PreviewFiles preview={preview} />

        <SectionTitle>Aperçu de la commande</SectionTitle>
        {preview?.commands.map((cmd, i) => (
          <div key={i} className="group/cmd relative">
            <pre className="overflow-x-auto rounded-xl bg-surface-secondary p-3 pr-10 font-mono text-[0.8148rem] break-all whitespace-pre-wrap">{cmd}</pre>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label="Copier"
              className="absolute top-1.5 right-1.5 opacity-0 group-hover/cmd:opacity-100"
              onPress={() => void navigator.clipboard.writeText(cmd).then(() => notify({ title: "Commande copiée", durationMs: 2000 }))}
            >
              <Copy className="size-3.5" />
            </Button>
          </div>
        ))}
        {!preview?.commands.length && <p className="text-[0.8148rem] text-muted">Complétez le connecteur pour voir la commande.</p>}
      </Modal.Body>

      <Modal.Footer>
        {missing.length > 0 && <span className="mr-auto text-[0.8148rem] text-muted">À renseigner : {missing.join(", ")}</span>}
        <Button size="sm" variant="secondary" onPress={onClose}>
          Annuler
        </Button>
        <Button
          size="sm"
          onPress={() => {
            onSave({ ...draft, name: draft.name.trim() });
            onClose();
          }}
          isDisabled={missing.length > 0}
        >
          {isNew ? "Créer" : "Enregistrer"}
        </Button>
      </Modal.Footer>
    </>
  );
}

function ContentSection({ draft, patch }: { draft: IeConnector; patch: (p: Partial<IeConnector>) => void }) {
  const [serverDbs, setServerDbs] = useState<DbInfo[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setServerDbs(await ieApi.databases(draft));
    } catch (e) {
      notify({ title: "Impossible de lister les bases", body: errorMessage(e), kind: "alarm", durationMs: 8000 });
    } finally {
      setLoading(false);
    }
  }

  const multi = draft.allDatabases || draft.databases.length > 1;
  return (
    <>
      <Toggle
        label="Toutes les bases"
        description="--all-databases (les bases système sont ignorées si un fichier par base)"
        isSelected={draft.allDatabases}
        onChange={(allDatabases) => patch({ allDatabases })}
      />
      {!draft.allDatabases && (
        <>
          <TagListInput label="Bases à exporter" value={draft.databases} onChange={(databases) => patch({ databases })} placeholder="Saisir un nom puis Entrée" />
          <div className="flex flex-col gap-2">
            <div>
              <Button size="sm" variant="secondary" onPress={() => void load()} isDisabled={loading}>
                {loading ? <Spinner size="sm" /> : <Database className="size-4" />}
                Charger les bases du serveur
              </Button>
            </div>
            {serverDbs && <DatabasePicker databases={serverDbs} selected={draft.databases} onChange={(databases) => patch({ databases })} />}
          </div>
        </>
      )}
      {multi && (
        <Toggle
          label="Un fichier par base"
          description={draft.splitPerDatabase ? "Une exécution de mariadb-dump par base ; pensez à {db} dans le nom." : "Toutes les bases dans un seul fichier."}
          isSelected={draft.splitPerDatabase}
          onChange={(splitPerDatabase) => patch({ splitPerDatabase })}
        />
      )}
      <TagListInput
        label="Tables à inclure"
        value={draft.tablesInclude}
        onChange={(tablesInclude) => patch({ tablesInclude })}
        placeholder="Toutes"
        description="Uniquement avec une seule base sélectionnée."
        isDisabled={draft.allDatabases || draft.databases.length !== 1}
      />
      <TagListInput
        label="Tables à exclure"
        value={draft.tablesExclude}
        onChange={(tablesExclude) => patch({ tablesExclude })}
        placeholder="table ou base.table"
        description="--ignore-table ; un nom sans base s'applique à chaque base exportée."
      />
    </>
  );
}

function PreviewFiles({ preview }: { preview: Preview | null }) {
  if (!preview) return null;
  if (preview.error)
    return (
      <Notice tone="warning" icon={<AlertTriangle className="size-4" />}>
        {preview.error}
      </Notice>
    );
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-surface-secondary p-3">
      <span className="text-[0.8148rem] font-medium text-muted">{preview.files.length > 1 ? `${preview.files.length} fichiers` : "Fichier"} produit(s) maintenant :</span>
      {preview.files.map((f) => (
        <code key={f} className="text-[0.8148rem] break-all">
          {f}
        </code>
      ))}
    </div>
  );
}

type BoolKey = { [K in keyof DumpOptions]: DumpOptions[K] extends boolean ? K : never }[keyof DumpOptions];

const OPTION_DEFS: { key: BoolKey; flag: string; hint: string }[] = [
  { key: "singleTransaction", flag: "--single-transaction", hint: "Instantané cohérent InnoDB sans verrou" },
  { key: "quick", flag: "--quick", hint: "Lecture ligne à ligne (grosses tables)" },
  { key: "lockTables", flag: "--lock-tables", hint: "Verrouille les tables (MyISAM)" },
  { key: "routines", flag: "--routines", hint: "Procédures et fonctions stockées" },
  { key: "triggers", flag: "--triggers", hint: "Déclencheurs" },
  { key: "events", flag: "--events", hint: "Événements planifiés" },
  { key: "noData", flag: "--no-data", hint: "Structure seule" },
  { key: "noCreateInfo", flag: "--no-create-info", hint: "Données seules" },
  { key: "addDropTable", flag: "--add-drop-table", hint: "DROP TABLE avant chaque CREATE" },
  { key: "addDropDatabase", flag: "--add-drop-database", hint: "DROP DATABASE avant CREATE" },
  { key: "createDatabase", flag: "--databases", hint: "CREATE DATABASE / USE même pour une base" },
  { key: "completeInsert", flag: "--complete-insert", hint: "Noms de colonnes dans les INSERT" },
  { key: "extendedInsert", flag: "--extended-insert", hint: "INSERT multi-lignes (plus compact)" },
  { key: "hexBlob", flag: "--hex-blob", hint: "Binaires en hexadécimal" },
  { key: "skipComments", flag: "--skip-comments", hint: "Sans commentaires d'en-tête" },
];

const VARIABLES = [
  { token: "{app}", hint: "Nom de l'application" },
  { token: "{env}", hint: "Nom de l'environnement" },
  { token: "{connector}", hint: "Nom du connecteur" },
  { token: "{db}", hint: "Base (ou liste de bases, ou « all »)" },
  { token: "{host}", hint: "Hôte" },
  { token: "{date}", hint: "Date et heure : 20261120_143000" },
  { token: "{date:%Y-%m-%d}", hint: "Date au format strftime" },
];
