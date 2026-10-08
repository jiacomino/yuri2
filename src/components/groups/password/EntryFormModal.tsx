import { useEffect, useState } from "react";
import { Button, Input, InputGroup, Label, Modal, TextField } from "@heroui/react";
import { Eye, EyeOff } from "lucide-react";
import type { EntryDraft } from "./state";

type EntryFormModalProps = {
  isOpen: boolean;
  /** Entrée à modifier ; `null` pour une création. */
  initial: EntryDraft | null;
  onSubmit: (entry: EntryDraft) => void;
  onClose: () => void;
};

const EMPTY: EntryDraft = { name: "", username: "", password: "" };

/** Fenêtre de création / modification d'un identifiant. */
export function EntryFormModal({ isOpen, initial, onSubmit, onClose }: EntryFormModalProps) {
  const [draft, setDraft] = useState<EntryDraft>(initial ?? EMPTY);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setDraft(initial ?? EMPTY);
    setShowPassword(false);
  }, [isOpen, initial]);

  const set = (patch: Partial<EntryDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const canSubmit = draft.name.trim().length > 0;

  function submit() {
    if (!canSubmit) return;
    onSubmit({
      name: draft.name.trim(),
      username: draft.username.trim(),
      password: draft.password,
      url: draft.url?.trim() || undefined,
    });
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Backdrop>
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>{initial ? "Modifier l'identifiant" : "Nouvel identifiant"}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <form
                id="password-entry-form"
                className="flex flex-col gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
              >
                <TextField value={draft.name} onChange={(name) => set({ name })} autoFocus isRequired>
                  <Label>Service</Label>
                  <Input placeholder="Ex. Forum cuisine" />
                </TextField>
                <TextField value={draft.username} onChange={(username) => set({ username })}>
                  <Label>Nom d'utilisateur / e-mail</Label>
                  <Input placeholder="marie.dupont@example.fr" />
                </TextField>
                <TextField
                  value={draft.password}
                  onChange={(password) => set({ password })}
                  type={showPassword ? "text" : "password"}
                >
                  <Label>Mot de passe</Label>
                  <InputGroup>
                    <InputGroup.Input className="font-mono" />
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
                <TextField value={draft.url ?? ""} onChange={(url) => set({ url })} type="url">
                  <Label>Adresse (optionnel)</Label>
                  <Input placeholder="https://…" />
                </TextField>
              </form>
            </Modal.Body>
            <Modal.Footer>
              <Button size="sm" variant="secondary" onPress={onClose}>
                Annuler
              </Button>
              <Button size="sm" variant="primary" type="submit" form="password-entry-form" isDisabled={!canSubmit}>
                Enregistrer
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
