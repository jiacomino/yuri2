import { useEffect, useState, type ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Button, Input, Label, ListBox, Modal, Select, TextField } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import { CalendarClock, DatabaseBackup, Download, Folders, Globe, Import, Upload } from "lucide-react";
import { CredentialsForm } from "@/components/groups/gcalendar/CredentialsForm";
import { exportBackup, importBackup } from "@/lib/backup";
import { loadBrowserPref, saveBrowserPref, type BrowserPref } from "@/lib/browserPref";
import { notify } from "@/lib/notify";
import { loadStartupPref, saveStartupPref, type StartupPref } from "@/lib/startupPref";
import { runYuri1Import } from "@/lib/yuri1/run";
import type { Workspace } from "@/types/workspace";

type SettingsDialogProps = {
  isOpen: boolean;
  workspaces: Workspace[];
  onClose: () => void;
};

/** Paramètres généraux de l'application, enregistrés à chaque modification. */
export function SettingsDialog({ isOpen, workspaces, onClose }: SettingsDialogProps) {
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(next) => !next && onClose()}>
      <Modal.Container size="md" scroll="inside">
        <Modal.Dialog aria-label="Paramètres">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>Paramètres</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-6">
            {/* Monté à l'ouverture seulement : relit les préférences et redétecte les navigateurs. */}
            {isOpen && (
              <>
                <BackupSection />
                <StartupSection workspaces={workspaces} />
                <BrowserSection />
                <Section icon={CalendarClock} title="Google Agenda">
                  <CredentialsForm onSaved={() => notify({ title: "Identifiants Google enregistrés", kind: "success", durationMs: 3000 })} />
                </Section>
              </>
            )}
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function Section({ icon: Icon, title, hint, children }: { icon: LucideIcon; title: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="flex items-center gap-2 text-[0.963rem] font-bold">
        <Icon className="size-4 text-muted" />
        {title}
      </h3>
      {hint && <p className="text-[0.8889rem] leading-relaxed text-muted">{hint}</p>}
      {children}
    </section>
  );
}

function BackupSection() {
  const [busy, setBusy] = useState(false);

  async function run(task: () => Promise<void>) {
    setBusy(true);
    try {
      await task();
    } finally {
      setBusy(false);
    }
  }

  const handleExport = () =>
    run(async () => {
      try {
        const path = await exportBackup();
        if (path) notify({ title: "Sauvegarde exportée", body: path, kind: "success" });
      } catch (err) {
        notify({ title: "Échec de l'export", body: String(err), kind: "alarm", durationMs: 8000 });
      }
    });

  const handleImport = () =>
    run(async () => {
      try {
        const done = await importBackup();
        if (done) window.location.reload();
      } catch (err) {
        notify({ title: "Échec de l'import", body: String(err), kind: "alarm", durationMs: 8000 });
      }
    });

  return (
    <Section
      icon={DatabaseBackup}
      title="Sauvegarde"
      hint={
        <>
          Exporte tous vos espaces et composants dans un fichier JSON. L'import fait un{" "}
          <strong className="text-foreground">remplacement complet</strong> des données actuelles.
        </>
      }
    >
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" isDisabled={busy} onPress={handleExport}>
          <Download className="size-3.5" />
          Exporter…
        </Button>
        <Button size="sm" variant="secondary" isDisabled={busy} onPress={handleImport}>
          <Upload className="size-3.5" />
          Importer…
        </Button>
        <Button size="sm" variant="ghost" isDisabled={busy} onPress={() => void runYuri1Import()}>
          <Import className="size-3.5" />
          Depuis yuri 1…
        </Button>
      </div>
    </Section>
  );
}

function StartupSection({ workspaces }: { workspaces: Workspace[] }) {
  const [pref, setPref] = useState(loadStartupPref);
  // Espace fixé puis supprimé : affiché comme « premier onglet », le repli réel.
  const value =
    pref.kind === "workspace" ? (workspaces.some((w) => w.id === pref.id) ? pref.id : "first") : pref.kind;

  function change(key: string) {
    const next: StartupPref = key === "last" || key === "first" ? { kind: key } : { kind: "workspace", id: key };
    setPref(next);
    saveStartupPref(next);
  }

  return (
    <Section
      icon={Folders}
      title="Espace ouvert au démarrage"
      hint="Si l'espace choisi a été supprimé, le premier onglet est utilisé."
    >
      <SelectField
        label="Espace ouvert au démarrage"
        value={value}
        onChange={change}
        options={[
          { id: "last", label: "Dernier espace utilisé" },
          { id: "first", label: "Premier onglet" },
          ...workspaces.map((w) => ({ id: w.id, label: w.name })),
        ]}
      />
    </Section>
  );
}

type DetectedBrowser = { name: string; path: string };

function BrowserSection() {
  const [pref, setPref] = useState<BrowserPref>(loadBrowserPref);
  const [detected, setDetected] = useState<DetectedBrowser[]>([]);
  const [customMode, setCustomMode] = useState(false);

  useEffect(() => {
    invoke<DetectedBrowser[]>("detect_browsers")
      .then(setDetected)
      .catch(() => setDetected([]));
  }, []);

  function apply(next: BrowserPref) {
    setPref(next);
    saveBrowserPref(next);
  }

  const matched = pref.kind === "path" ? detected.find((b) => b.path === pref.path) : undefined;
  const value = pref.kind === "default" && !customMode ? "default" : matched && !customMode ? matched.path : "custom";

  function change(key: string) {
    if (key === "default") {
      setCustomMode(false);
      apply({ kind: "default" });
    } else if (key === "custom") {
      setCustomMode(true);
    } else {
      const b = detected.find((d) => d.path === key);
      setCustomMode(false);
      if (b) apply({ kind: "path", name: b.name, path: b.path });
    }
  }

  async function browse() {
    const picked = await open({ title: "Choisir un navigateur", filters: [{ name: "Exécutables", extensions: ["exe"] }] });
    if (typeof picked === "string") apply({ kind: "path", name: "Personnalisé", path: picked });
  }

  return (
    <Section
      icon={Globe}
      title="Navigateur pour les liens"
      hint="« Système » utilise le navigateur par défaut de Windows."
    >
      <SelectField
        label="Navigateur pour les liens"
        value={value}
        onChange={change}
        options={[
          { id: "default", label: "Système (par défaut)" },
          ...detected.map((b) => ({ id: b.path, label: b.name })),
          { id: "custom", label: "Personnalisé…" },
        ]}
      />
      {value === "custom" && (
        <div className="flex items-end gap-2">
          <TextField
            value={pref.kind === "path" ? pref.path : ""}
            onChange={(path) => {
              // Reste en mode personnalisé même champ vidé, le temps de retaper un chemin.
              setCustomMode(true);
              apply(path.trim() ? { kind: "path", name: "Personnalisé", path } : { kind: "default" });
            }}
            className="flex min-w-0 flex-1 flex-col gap-1"
          >
            <Label className="text-[0.8889rem] font-semibold">Chemin de l'exécutable</Label>
            <Input placeholder="C:\chemin\vers\navigateur.exe" spellCheck={false} className="font-mono text-xs" />
          </TextField>
          <Button size="sm" variant="secondary" onPress={() => void browse()}>
            Parcourir…
          </Button>
        </div>
      )}
    </Section>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (key: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <Select aria-label={label} value={value} onChange={(key) => key != null && onChange(String(key))} className="w-full">
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((o) => (
            <ListBox.Item key={o.id} id={o.id} textValue={o.label}>
              {o.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
