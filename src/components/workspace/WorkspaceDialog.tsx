import { useState, type FormEvent } from "react";
import { Button, Input, Label, Modal, TextField } from "@heroui/react";
import { ColorSwatches, PALETTE } from "@/components/shared/ColorSwatches";
import type { Workspace } from "@/types/workspace";

export type WorkspaceDialogTarget = { mode: "create" } | { mode: "edit"; workspace: Workspace };

type WorkspaceDialogProps = {
  target: WorkspaceDialogTarget | null;
  onClose: () => void;
  onSubmit: (name: string, color: string | null) => void;
};

/** Création ou modification d'un espace de travail (nom + couleur). */
export function WorkspaceDialog({ target, onClose, onSubmit }: WorkspaceDialogProps) {
  return (
    <Modal.Backdrop isOpen={target !== null} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container size="sm">
        <Modal.Dialog>
          {target && (
            <WorkspaceForm
              key={target.mode === "edit" ? target.workspace.id : "create"}
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

type WorkspaceFormProps = Omit<WorkspaceDialogProps, "target"> & { target: WorkspaceDialogTarget };

function WorkspaceForm({ target, onClose, onSubmit }: WorkspaceFormProps) {
  const isEdit = target.mode === "edit";
  const [name, setName] = useState(isEdit ? target.workspace.name : "");
  const [color, setColor] = useState<string | null>(isEdit ? target.workspace.color : PALETTE[1]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return;
    onSubmit(clean, color);
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="contents">
      <Modal.CloseTrigger />
      <Modal.Header>
        <Modal.Heading>{isEdit ? "Modifier l'espace de travail" : "Nouvel espace de travail"}</Modal.Heading>
        {!isEdit && (
          <p className="text-[0.8889rem] text-muted">Un espace regroupe des composants sur son propre canevas.</p>
        )}
      </Modal.Header>
      <Modal.Body className="flex flex-col gap-5">
        <TextField value={name} onChange={setName} autoFocus isRequired>
          <Label>Nom</Label>
          <Input placeholder="Travail, Maison, Projet Atlas…" />
        </TextField>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Couleur</span>
          <ColorSwatches value={color} onChange={setColor} allowNone />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button size="sm" variant="secondary" onPress={onClose}>
          Annuler
        </Button>
        <Button size="sm" type="submit" isDisabled={!name.trim()}>
          {isEdit ? "Enregistrer" : "Créer"}
        </Button>
      </Modal.Footer>
    </form>
  );
}
