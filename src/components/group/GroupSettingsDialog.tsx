import { useState, type FormEvent } from "react";
import { Button, Input, Label, Modal, TextField } from "@heroui/react";
import { ColorSwatches } from "@/components/shared/ColorSwatches";
import { TagInput } from "@/components/shared/TagInput";
import { cn } from "@/lib/utils";
import type { GroupRecord, Workspace } from "@/types/workspace";

export type GroupSettings = Pick<GroupRecord, "name" | "color" | "tags" | "workspaceId">;

type GroupSettingsDialogProps = {
  group: GroupRecord | null;
  workspaces: Workspace[];
  /** Tags déjà utilisés, proposés à la saisie. */
  tagSuggestions: string[];
  onClose: () => void;
  onSave: (id: string, settings: GroupSettings) => void;
};

/** Réglages d'un composant : nom, couleur, tags et espace de travail. */
export function GroupSettingsDialog({ group, workspaces, tagSuggestions, onClose, onSave }: GroupSettingsDialogProps) {
  return (
    <Modal.Backdrop isOpen={group !== null} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container size="sm">
        <Modal.Dialog>
          {group && (
            <SettingsForm
              key={group.id}
              group={group}
              workspaces={workspaces}
              tagSuggestions={tagSuggestions}
              onClose={onClose}
              onSave={onSave}
            />
          )}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

type SettingsFormProps = Omit<GroupSettingsDialogProps, "group"> & { group: GroupRecord };

function SettingsForm({ group, workspaces, tagSuggestions, onClose, onSave }: SettingsFormProps) {
  const [name, setName] = useState(group.name);
  const [color, setColor] = useState(group.color);
  const [tags, setTags] = useState(group.tags);
  const [workspaceId, setWorkspaceId] = useState(group.workspaceId);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return;
    onSave(group.id, { name: clean, color, tags, workspaceId });
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="contents">
      <Modal.CloseTrigger />
      <Modal.Header>
        <Modal.Heading>Réglages du composant</Modal.Heading>
      </Modal.Header>
      <Modal.Body className="flex flex-col gap-5">
        <TextField value={name} onChange={setName} autoFocus isRequired>
          <Label>Nom</Label>
          <Input placeholder="Nom du composant" />
        </TextField>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Couleur</span>
          <ColorSwatches value={color} onChange={setColor} allowNone />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Tags</span>
          <TagInput value={tags} onChange={setTags} suggestions={tagSuggestions} placeholder="travail, perso…" />
        </div>
        {workspaces.length > 1 && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Espace de travail</span>
            <div className="flex flex-wrap gap-2">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => setWorkspaceId(ws.id)}
                  className={cn(
                    "flex h-8 cursor-pointer items-center gap-2 rounded-full px-3 text-[0.8889rem] font-semibold transition-colors",
                    ws.id === workspaceId
                      ? "bg-accent text-accent-foreground"
                      : "bg-default text-muted hover:text-foreground",
                  )}
                >
                  {ws.color && <span className="size-2 rounded-full" style={{ background: ws.color }} />}
                  {ws.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button size="sm" variant="secondary" onPress={onClose}>
          Annuler
        </Button>
        <Button size="sm" type="submit" isDisabled={!name.trim()}>
          Enregistrer
        </Button>
      </Modal.Footer>
    </form>
  );
}
