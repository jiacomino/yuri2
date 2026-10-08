import { useState } from "react";
import { Button, Input, Label, Modal, TextArea } from "@heroui/react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppPicker } from "./AppPicker";
import { PriorityPicker } from "./PriorityPicker";
import type { AppTag, CardPatch, CardPriority, KanbanCard } from "./state";

type CardDetailsModalProps = {
  card: KanbanCard;
  columnId: string;
  columns: { id: string; name: string }[];
  apps: AppTag[];
  onCreateApp: (name: string, color: string) => string | undefined;
  /** Enregistre les modifications et, si la colonne a changé, déplace la carte. */
  onSave: (patch: CardPatch, columnId: string) => void;
  onRemove: () => void;
  onClose: () => void;
};

/** Fenêtre de détails d'une carte : titre, description, priorité, application, colonne. */
export function CardDetailsModal(props: CardDetailsModalProps) {
  return (
    <Modal isOpen onOpenChange={(open) => !open && props.onClose()}>
      <Modal.Backdrop>
        <Modal.Container size="md" placement="center">
          <Modal.Dialog aria-label="Détails de la carte">
            {/* Formulaire monté à l'ouverture : son état local part de la carte. */}
            <CardDetailsForm {...props} />
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function CardDetailsForm({ card, columnId, columns, apps, onCreateApp, onSave, onRemove, onClose }: CardDetailsModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");
  const [priority, setPriority] = useState<CardPriority>(card.priority ?? "normal");
  const [appId, setAppId] = useState<string | undefined>(card.appId);
  const [targetColumnId, setTargetColumnId] = useState(columnId);

  function save() {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    onSave({ title: cleanTitle, description: description.trim(), priority, appId: appId ?? "" }, targetColumnId);
    onClose();
  }

  return (
    <form
      className="contents"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <Modal.CloseTrigger />
      <Modal.Header>
        <Modal.Heading>Détails de la carte</Modal.Heading>
      </Modal.Header>
      <Modal.Body className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted">Titre</Label>
          <Input
            autoFocus
            aria-label="Titre"
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            placeholder="Titre de la carte"
            className="rounded-xl"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted">Description</Label>
          <TextArea
            aria-label="Description"
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            placeholder="Description (optionnel)"
            rows={4}
            className="resize-none rounded-xl text-[0.963rem] leading-relaxed"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted">Priorité</Label>
          <PriorityPicker value={priority} onChange={setPriority} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted">Application</Label>
          <AppPicker apps={apps} value={appId} onChange={setAppId} onCreateApp={onCreateApp} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted">Colonne</Label>
          <div role="radiogroup" aria-label="Colonne" className="flex flex-wrap gap-1.5">
            {columns.map((c) => {
              const active = c.id === targetColumnId;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setTargetColumnId(c.id)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs transition-colors",
                    active ? "bg-accent text-accent-foreground" : "bg-surface-secondary text-muted hover:text-foreground",
                  )}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          className="mr-auto text-danger"
          onPress={() => {
            onRemove();
            onClose();
          }}
        >
          <Trash2 className="size-3.5" />
          Supprimer
        </Button>
        <Button size="sm" variant="secondary" onPress={onClose}>
          Annuler
        </Button>
        <Button type="submit" size="sm" variant="primary" isDisabled={!title.trim()}>
          Enregistrer
        </Button>
      </Modal.Footer>
    </form>
  );
}
