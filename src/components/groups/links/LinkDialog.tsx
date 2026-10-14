import { useState, type FormEvent } from "react";
import { Button, FieldError, Input, InputGroup, Label, Modal, TextField } from "@heroui/react";
import { Eye, EyeOff } from "lucide-react";
import { hostnameOf, validateUrl } from "@/lib/url";

export type LinkDialogTarget =
  | { mode: "add"; tabId: string }
  | { mode: "edit"; tabId: string; itemId: string; name: string; url: string; username?: string; password?: string };

/** Valeurs saisies ; identifiant et mot de passe valent `undefined` quand ils sont vides. */
export type LinkDraft = { name: string; url: string; username?: string; password?: string };

type LinkDialogProps = {
  target: LinkDialogTarget | null;
  /** Nom de l'onglet concerné, rappelé dans la description. */
  tabName?: string;
  onClose: () => void;
  onSubmit: (draft: LinkDraft) => void;
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
  const [username, setUsername] = useState(isEdit ? (target.username ?? "") : "");
  const [password, setPassword] = useState(isEdit ? (target.password ?? "") : "");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = validateUrl(url);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSubmit({
      name: name.trim() || hostnameOf(result.url),
      url: result.url,
      username: username.trim() || undefined,
      password: password || undefined,
    });
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
        <TextField value={username} onChange={setUsername}>
          <Label>Nom d'utilisateur (optionnel)</Label>
          <Input placeholder="marie.dupont@example.fr" autoComplete="off" />
        </TextField>
        <TextField value={password} onChange={setPassword} type={showPassword ? "text" : "password"}>
          <Label>Mot de passe (optionnel)</Label>
          <InputGroup>
            <InputGroup.Input className="font-mono" autoComplete="new-password" />
            <InputGroup.Suffix>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                onPress={() => setShowPassword((s) => !s)}
              >
                {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </Button>
            </InputGroup.Suffix>
          </InputGroup>
        </TextField>
        {(username || password) && (
          <p className="text-xs text-muted">Stocké en clair sur cet ordinateur. À réserver aux comptes peu sensibles.</p>
        )}
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
