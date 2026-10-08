import { useState, type FormEvent } from "react";
import { Button, FieldError, Input, Label, Modal, TextField } from "@heroui/react";
import { hostnameOf, validateUrl } from "@/lib/url";

export type LinkDialogTarget =
  | { mode: "add"; tabId: string }
  | { mode: "edit"; tabId: string; itemId: string; name: string; url: string };

type LinkDialogProps = {
  target: LinkDialogTarget | null;
  /** Nom de l'onglet concerné, rappelé dans la description. */
  tabName?: string;
  onClose: () => void;
  onSubmit: (name: string, url: string) => void;
};

/** Fenêtre d'ajout / modification d'un lien (nom optionnel + URL validée). */
export function LinkDialog({ target, tabName, onClose, onSubmit }: LinkDialogProps) {
  return (
    <Modal.Backdrop isOpen={target !== null} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container size="sm">
        <Modal.Dialog>
          {/* `key` réinitialise le formulaire à chaque ouverture. */}
          {target && (
            <LinkForm
              key={target.mode === "edit" ? target.itemId : `add-${target.tabId}`}
              target={target}
              tabName={tabName}
              onClose={onClose}
              onSubmit={onSubmit}
            />
          )}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

type LinkFormProps = Omit<LinkDialogProps, "target"> & { target: LinkDialogTarget };

function LinkForm({ target, tabName, onClose, onSubmit }: LinkFormProps) {
  const isEdit = target.mode === "edit";
  const [name, setName] = useState(isEdit ? target.name : "");
  const [url, setUrl] = useState(isEdit ? target.url : "");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = validateUrl(url);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSubmit(name.trim() || hostnameOf(result.url), result.url);
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="contents">
      <Modal.CloseTrigger />
      <Modal.Header>
        <Modal.Heading>{isEdit ? "Modifier le lien" : "Ajouter un lien"}</Modal.Heading>
        {tabName && <p className="text-xs text-muted">Onglet « {tabName} »</p>}
      </Modal.Header>
      <Modal.Body className="flex flex-col gap-3">
        <TextField value={name} onChange={setName} autoFocus>
          <Label>Nom (optionnel)</Label>
          <Input placeholder="Mon lien" />
        </TextField>
        <TextField
          value={url}
          onChange={(v) => {
            setUrl(v);
            if (error) setError(null);
          }}
          isInvalid={!!error}
        >
          <Label>URL</Label>
          <Input placeholder="https://exemple.com" />
          <FieldError>{error}</FieldError>
        </TextField>
      </Modal.Body>
      <Modal.Footer>
        <Button size="sm" variant="secondary" onPress={onClose}>
          Annuler
        </Button>
        <Button size="sm" type="submit">
          {isEdit ? "Enregistrer" : "Ajouter"}
        </Button>
      </Modal.Footer>
    </form>
  );
}
