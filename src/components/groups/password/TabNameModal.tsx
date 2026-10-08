import { useEffect, useState } from "react";
import { Button, Input, Label, Modal, TextField } from "@heroui/react";

type TabNameModalProps = {
  isOpen: boolean;
  title: string;
  initialName: string;
  submitLabel: string;
  onSubmit: (name: string) => void;
  onClose: () => void;
};

/** Petite fenêtre de saisie du nom d'un onglet (création ou renommage). */
export function TabNameModal({ isOpen, title, initialName, submitLabel, onSubmit, onClose }: TabNameModalProps) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (isOpen) setName(initialName);
  }, [isOpen, initialName]);

  const clean = name.trim();

  function submit() {
    if (!clean) return;
    onSubmit(clean);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Backdrop>
        <Modal.Container size="xs">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>{title}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <form
                id="password-tab-name"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
              >
                <TextField value={name} onChange={setName} autoFocus aria-label="Nom de l'onglet">
                  <Label>Nom</Label>
                  <Input placeholder="Ex. Perso, Travail…" />
                </TextField>
              </form>
            </Modal.Body>
            <Modal.Footer>
              <Button size="sm" variant="secondary" onPress={onClose}>
                Annuler
              </Button>
              <Button size="sm" variant="primary" type="submit" form="password-tab-name" isDisabled={!clean}>
                {submitLabel}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
