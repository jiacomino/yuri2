import { useEffect, useState } from "react";
import { Button, Modal, Spinner } from "@heroui/react";
import { AlertTriangle, Database, DatabaseZap } from "lucide-react";
import { Notice, PathInput, TextInput, Toggle } from "@/components/importexport/ui";
import { errorMessage, ieApi, type IeConnector, type IeSettings, type ImportPrefs, type ImportRequest } from "@/lib/importExport";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";

type Props = {
  connector: IeConnector | null;
  settings: IeSettings;
  /** Fichier proposé par défaut (dernier export réussi du connecteur). */
  defaultFile: string;
  /** Lance l'import ; les réglages sont mémorisés dans le connecteur. */
  onRun: (request: ImportRequest) => void;
  onClose: () => void;
};

/** Restauration d'un dump (.sql / .sql.gz) dans le serveur du connecteur, via le client mariadb. */
export function ImportDialog({ connector, settings, defaultFile, onRun, onClose }: Props) {
  return (
    <Modal.Backdrop isOpen={!!connector} onOpenChange={(o) => !o && onClose()} isDismissable={false}>
      <Modal.Container size="lg" scroll="inside">
        <Modal.Dialog aria-label="Importer un dump" className="w-[min(46rem,94vw)] max-w-none">
          {connector && <ImportForm connector={connector} settings={settings} defaultFile={defaultFile} onRun={onRun} onClose={onClose} />}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function ImportForm({ connector, settings, defaultFile, onRun, onClose }: Omit<Props, "connector"> & { connector: IeConnector }) {
  const [file, setFile] = useState(defaultFile);
  const [prefs, setPrefs] = useState<ImportPrefs>(connector.importPrefs);
  const [preview, setPreview] = useState<{ text?: string; error?: string }>({});
  const [dbs, setDbs] = useState<string[] | null>(null);
  const [loadingDbs, setLoadingDbs] = useState(false);
  const [typed, setTyped] = useState("");

  const env = settings.environments.find((e) => e.id === connector.environmentId);
  const app = settings.applications.find((a) => a.id === connector.applicationId);
  const server = connector.serverId ? settings.servers.find((s) => s.id === connector.serverId) : undefined;
  const host = server ? `${server.host}:${server.port}` : `${connector.host}:${connector.port}`;
  const request: ImportRequest = { ...prefs, file: file.trim() };
  const patch = (p: Partial<ImportPrefs>) => setPrefs((x) => ({ ...x, ...p }));

  useEffect(() => {
    const t = setTimeout(() => {
      if (!request.file) return setPreview({});
      ieApi
        .importPreview(connector, request)
        .then((text) => setPreview({ text }))
        .catch((e) => setPreview({ error: errorMessage(e) }));
    }, 250);
    return () => clearTimeout(t);
  }, [file, prefs]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadDbs() {
    setLoadingDbs(true);
    try {
      setDbs((await ieApi.databases(connector)).map((d) => d.name).filter((n) => !SYSTEM.includes(n)));
    } catch (e) {
      notify({ title: "Impossible de lister les bases", body: errorMessage(e), kind: "alarm", durationMs: 8000 });
    } finally {
      setLoadingDbs(false);
    }
  }

  const sensitive = !!env?.confirm;
  const missing: string[] = [];
  if (!request.file) missing.push("fichier");
  if (preview.error) missing.push("arguments valides");
  if (sensitive && typed.trim() !== env.name.trim()) missing.push(`confirmation « ${env.name} »`);

  return (
    <>
      <Modal.CloseTrigger />
      <Modal.Header>
        <Modal.Heading className="flex items-center gap-2">
          <DatabaseZap className="size-5 text-danger" />
          Importer un dump
        </Modal.Heading>
        <p className="text-[0.8889rem] text-muted">
          {[app?.name, env?.name, connector.name].filter(Boolean).join(" · ")} — serveur <span className="font-mono">{host}</span>
        </p>
      </Modal.Header>
      <Modal.Body className="flex flex-col gap-4">
        <Notice tone={sensitive ? "danger" : "warning"} icon={<AlertTriangle className="size-4" />}>
          L'import exécute le fichier SQL sur le serveur : les tables existantes peuvent être remplacées (DROP TABLE), sans retour
          arrière possible.{sensitive && <strong> Environnement sensible.</strong>}
        </Notice>
        <PathInput
          label="Fichier à importer"
          value={file}
          onChange={setFile}
          placeholder="D:\Sauvegardes\boutique.sql.gz"
          description="Fichier .sql ou compressé gzip (détecté automatiquement)."
          filters={[{ name: "Dump SQL", extensions: ["sql", "gz"] }]}
        />
        <div className="flex flex-col gap-2">
          <div className="flex items-end gap-2">
            <TextInput
              label="Base cible"
              value={prefs.database}
              onChange={(database) => patch({ database })}
              placeholder="Celle désignée par le fichier (USE …)"
              className="min-w-0 flex-1"
              inputClassName="font-mono text-xs"
            />
            <Button variant="secondary" onPress={() => void loadDbs()} isDisabled={loadingDbs}>
              {loadingDbs ? <Spinner size="sm" /> : <Database className="size-4" />}
              Bases du serveur
            </Button>
          </div>
          {dbs && (
            <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
              {dbs.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => patch({ database: d })}
                  className={cn("rounded-md px-1.5 py-0.5 font-mono text-[0.8148rem]", prefs.database === d ? "bg-accent text-accent-foreground" : "bg-default hover:bg-accent/15")}
                >
                  {d}
                </button>
              ))}
              {dbs.length === 0 && <span className="text-[0.8148rem] text-muted">Aucune base utilisateur.</span>}
            </div>
          )}
          <p className="text-[0.8148rem] text-muted">
            Un dump fait avec « --databases » ou « toutes les bases » contient ses propres « USE » : il écrira dans ses bases d'origine quelle que soit la base cible.
          </p>
        </div>
        <Toggle
          label="Créer la base si elle n'existe pas"
          description="CREATE DATABASE IF NOT EXISTS avant l'import"
          isSelected={prefs.createDatabase}
          isDisabled={!prefs.database.trim()}
          onChange={(createDatabase) => patch({ createDatabase })}
        />
        <Toggle
          label="Continuer malgré les erreurs"
          description="--force : les instructions en erreur sont ignorées (le résultat peut être incomplet)"
          isSelected={prefs.force}
          onChange={(force) => patch({ force })}
        />
        <div className="grid grid-cols-2 gap-4">
          <TextInput
            label="Jeu de caractères"
            value={prefs.defaultCharacterSet}
            onChange={(defaultCharacterSet) => patch({ defaultCharacterSet })}
            placeholder="(défaut du client)"
            description="--default-character-set"
          />
          <TextInput
            label="Arguments supplémentaires"
            value={prefs.extraArgs}
            onChange={(extraArgs) => patch({ extraArgs })}
            placeholder="ex. --max-allowed-packet=1G"
            inputClassName="font-mono text-xs"
          />
        </div>
        {preview.text && <pre className="overflow-x-auto rounded-xl bg-surface-secondary p-3 font-mono text-[0.8148rem] break-all whitespace-pre-wrap">{preview.text}</pre>}
        {preview.error && <Notice tone="danger">{preview.error}</Notice>}
        {sensitive && env && (
          <TextInput label={`Tapez « ${env.name} » pour confirmer`} value={typed} onChange={setTyped} placeholder={env.name} />
        )}
      </Modal.Body>
      <Modal.Footer>
        {missing.length > 0 && <span className="mr-auto text-[0.8148rem] text-muted">À renseigner : {missing.join(", ")}</span>}
        <Button size="sm" variant="secondary" onPress={onClose}>
          Annuler
        </Button>
        <Button
          size="sm"
          variant="danger"
          isDisabled={missing.length > 0}
          onPress={() => {
            onRun(request);
            onClose();
          }}
        >
          Lancer l'import
        </Button>
      </Modal.Footer>
    </>
  );
}

const SYSTEM = ["information_schema", "performance_schema", "mysql", "sys"];
