import { useState, type FormEvent } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { Button, FieldError, Input, Label, Modal, Switch, TextField } from "@heroui/react";
import { FolderOpen } from "lucide-react";
import { fetchIcon } from "./api";
import { nameFromPath, type LaunchApp } from "./state";

export type AppDialogTarget = { mode: "add"; path?: string } | { mode: "edit"; app: LaunchApp };

/** Champs saisis ; l'icône est recalculée quand le chemin change. */
export type AppDraft = Pick<LaunchApp, "name" | "path" | "args" | "cwd" | "admin" | "icon">;

type AppDialogProps = {
  target: AppDialogTarget | null;
  onClose: () => void;
  onSubmit: (draft: AppDraft) => void;
};

/** Fenêtre d'ajout / modification d'une application. */
export function AppDialog({ target, onClose, onSubmit }: AppDialogProps) {
  return (
    <Modal.Backdrop isOpen={target !== null} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Modal.Container size="md">
        <Modal.Dialog>
          {/* `key` réinitialise le formulaire à chaque ouverture. */}
          {target && (
            <AppForm
              key={target.mode === "edit" ? target.app.id : `add-${target.path ?? ""}`}
              target={target}
              onClose={onClose}
              onSubmit={onSubmit}
            />
          )}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

/** Choix d'un programme ou d'un fichier quelconque. */
export async function pickProgram(): Promise<string | null> {
  const picked = await open({
    title: "Choisir une application",
    multiple: false,
    filters: [
      { name: "Programmes et raccourcis", extensions: ["exe", "lnk", "bat", "cmd", "ps1", "url", "msc"] },
      { name: "Tous les fichiers", extensions: ["*"] },
    ],
  });
  return typeof picked === "string" ? picked : null;
}

type AppFormProps = Omit<AppDialogProps, "target"> & { target: AppDialogTarget };

function AppForm({ target, onClose, onSubmit }: AppFormProps) {
  const initial = target.mode === "edit" ? target.app : null;
  const [name, setName] = useState(initial?.name ?? "");
  const [path, setPath] = useState(initial?.path ?? (target.mode === "add" ? (target.path ?? "") : ""));
  const [args, setArgs] = useState(initial?.args ?? "");
  const [cwd, setCwd] = useState(initial?.cwd ?? "");
  const [admin, setAdmin] = useState(initial?.admin ?? false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function browseProgram() {
    const picked = await pickProgram();
    if (!picked) return;
    setPath(picked);
    setError(null);
    if (!name.trim()) setName(nameFromPath(picked));
  }

  async function browseFolder() {
    const picked = await open({ title: "Dossier de travail", directory: true, multiple: false });
    if (typeof picked === "string") setCwd(picked);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = path.trim();
    if (!trimmed) {
      setError("Indiquez le programme, le fichier ou la commande à lancer.");
      return;
    }
    setSaving(true);
    const icon = initial && initial.path === trimmed && initial.icon ? initial.icon : await fetchIcon(trimmed);
    onSubmit({ name: name.trim() || nameFromPath(trimmed), path: trimmed, args: args.trim(), cwd: cwd.trim(), admin, icon });
    onClose();
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="contents">
      <Modal.CloseTrigger />
      <Modal.Header>
        <Modal.Heading>{initial ? "Modifier l'application" : "Ajouter une application"}</Modal.Heading>
        <p className="text-xs text-muted">
          Programme, raccourci, document, dossier ou commande (<code>ms-settings:</code>, <code>%windir%\…</code>).
        </p>
      </Modal.Header>
      <Modal.Body className="flex flex-col gap-3">
        <div className="flex items-end gap-1.5">
          <TextField
            value={path}
            onChange={(v) => {
              setPath(v);
              if (error) setError(null);
            }}
            isInvalid={!!error}
            className="min-w-0 flex-1"
            autoFocus={!initial}
          >
            <Label>Chemin ou commande</Label>
            <Input placeholder="C:\Program Files\…\app.exe" />
            <FieldError>{error}</FieldError>
          </TextField>
          <Button size="sm" variant="secondary" className={error ? "mb-6" : undefined} onPress={() => void browseProgram()}>
            <FolderOpen className="size-3.5" />
            Parcourir…
          </Button>
        </div>
        <TextField value={name} onChange={setName}>
          <Label>Nom (optionnel)</Label>
          <Input placeholder={path.trim() ? nameFromPath(path) : "Mon application"} />
        </TextField>
        <TextField value={args} onChange={setArgs}>
          <Label>Arguments (optionnel)</Label>
          <Input placeholder={'--new-window "C:\\Projets"'} />
        </TextField>
        <div className="flex items-end gap-1.5">
          <TextField value={cwd} onChange={setCwd} className="min-w-0 flex-1">
            <Label>Dossier de travail (optionnel)</Label>
            <Input placeholder="Par défaut" />
          </TextField>
          <Button isIconOnly size="sm" variant="secondary" aria-label="Choisir le dossier" onPress={() => void browseFolder()}>
            <FolderOpen className="size-3.5" />
          </Button>
        </div>
        <Switch size="sm" isSelected={admin} onChange={setAdmin}>
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Label className="text-xs">Toujours lancer en administrateur</Label>
          </Switch.Content>
        </Switch>
      </Modal.Body>
      <Modal.Footer>
        <Button size="sm" variant="secondary" onPress={onClose}>
          Annuler
        </Button>
        <Button size="sm" type="submit" isPending={saving}>
          {initial ? "Enregistrer" : "Ajouter"}
        </Button>
      </Modal.Footer>
    </form>
  );
}
