import { useState, type FormEvent } from "react";
import { Button, Input, Label, Modal, TextField } from "@heroui/react";
import { groupDefinitions } from "@/components/groups/registry";
import type { GroupKind } from "@/components/groups/types";
import { TagInput } from "@/components/shared/TagInput";
import { KindCard } from "./KindCard";

type AddGroupDialogProps = {
  isOpen: boolean;
  /** Nom de l'espace de destination, rappelé dans l'en-tête. */
  workspaceName?: string;
  /** Tags déjà utilisés dans l'espace, proposés à la saisie. */
  tagSuggestions: string[];
  onClose: () => void;
  onCreate: (kind: GroupKind, name: string, tags: string[]) => void;
};

/** Fenêtre « Ajouter un composant » : choix du type puis du nom. */
export function AddGroupDialog({ isOpen, workspaceName, tagSuggestions, onClose, onCreate }: AddGroupDialogProps) {
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container size="lg">
        <Modal.Dialog>
          {isOpen && (
            <AddGroupForm
              workspaceName={workspaceName}
              tagSuggestions={tagSuggestions}
              onClose={onClose}
              onCreate={onCreate}
            />
          )}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function AddGroupForm({ workspaceName, tagSuggestions, onClose, onCreate }: Omit<AddGroupDialogProps, "isOpen">) {
  const [kind, setKind] = useState<GroupKind>(groupDefinitions[0].kind);
  const [name, setName] = useState(groupDefinitions[0].label);
  // Tant que l'utilisateur n'a pas saisi de nom, celui-ci suit le type choisi.
  const [nameTouched, setNameTouched] = useState(false);
  const [tags, setTags] = useState<string[]>([]);

  function select(next: GroupKind) {
    setKind(next);
    if (!nameTouched) setName(groupDefinitions.find((d) => d.kind === next)?.label ?? "");
  }

  function create(k: GroupKind, n: string) {
    const clean = n.trim();
    if (!clean) return;
    onCreate(k, clean, tags);
    onClose();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    create(kind, name);
  }

  return (
    <form onSubmit={handleSubmit} className="contents">
      <Modal.CloseTrigger />
      <Modal.Header>
        <Modal.Heading>Ajouter un composant</Modal.Heading>
        {workspaceName && <p className="text-[0.8889rem] text-muted">Dans l'espace « {workspaceName} »</p>}
      </Modal.Header>
      <Modal.Body className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2.5 p-0.5 sm:grid-cols-4" role="radiogroup" aria-label="Type de composant">
          {groupDefinitions.map((def) => (
            <KindCard
              key={def.kind}
              def={def}
              selected={def.kind === kind}
              onSelect={() => select(def.kind)}
              onConfirm={() => create(def.kind, nameTouched ? name : def.label)}
            />
          ))}
        </div>
        <TextField
          value={name}
          onChange={(v) => {
            setName(v);
            setNameTouched(true);
          }}
          isRequired
        >
          <Label>Nom du composant</Label>
          <Input placeholder="Nom du composant" />
        </TextField>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Tags</span>
          <TagInput
            value={tags}
            onChange={setTags}
            suggestions={tagSuggestions}
            placeholder="Ajouter des tags (Entrée ou virgule)…"
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <span className="mr-auto text-[0.8889rem] text-muted">Double-clic sur un type pour le créer directement.</span>
        <Button size="sm" variant="secondary" onPress={onClose}>
          Annuler
        </Button>
        <Button size="sm" type="submit" isDisabled={!name.trim()}>
          Créer
        </Button>
      </Modal.Footer>
    </form>
  );
}
