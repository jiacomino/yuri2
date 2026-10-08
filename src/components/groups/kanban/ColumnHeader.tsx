import { useRef, useState, type Key } from "react";
import { Button, Dropdown, Input, Label } from "@heroui/react";
import { ChevronLeft, ChevronRight, Ellipsis, Pencil, Plus, Trash2 } from "lucide-react";
import { columnDotColor } from "./meta";

type ColumnHeaderProps = {
  name: string;
  count: number;
  isFirst: boolean;
  isLast: boolean;
  onRename: (name: string) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onAddCard: () => void;
};

/** En-tête de colonne : nom (double-clic pour renommer), compteur, menu. */
export function ColumnHeader({ name, count, isFirst, isLast, onRename, onMove, onRemove, onAddCard }: ColumnHeaderProps) {
  const [editing, setEditing] = useState(false);

  function handleAction(key: Key) {
    if (key === "rename") setEditing(true);
    else if (key === "add") onAddCard();
    else if (key === "left") onMove(-1);
    else if (key === "right") onMove(1);
    else if (key === "delete") onRemove();
  }

  if (editing) {
    return (
      <div className="flex h-8 items-center px-1">
        <ColumnNameInput
          initial={name}
          onDone={(next) => {
            const clean = next?.trim();
            if (clean) onRename(clean);
            setEditing(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-7 items-center gap-1.5 pl-0.5">
      <span className="size-2 shrink-0 rounded-full" style={{ background: columnDotColor(name) }} />
      <span
        onDoubleClick={() => setEditing(true)}
        title="Double-cliquer pour renommer"
        className="truncate text-[0.8889rem] font-bold"
      >
        {name}
      </span>
      <span className="text-[0.8889rem] font-semibold tabular-nums text-muted">{count}</span>
      <span className="flex-1" />
      <Button isIconOnly size="sm" variant="ghost" aria-label="Ajouter une carte" onPress={onAddCard} className="size-6 min-w-6 text-muted">
        <Plus className="size-3.5" />
      </Button>
      <Dropdown>
        <Button isIconOnly size="sm" variant="ghost" aria-label={`Options de la colonne ${name}`} className="size-6 min-w-6 text-muted">
          <Ellipsis className="size-3.5" />
        </Button>
        <Dropdown.Popover placement="bottom end">
          <Dropdown.Menu
            aria-label="Options de la colonne"
            onAction={handleAction}
            disabledKeys={[...(isFirst ? ["left"] : []), ...(isLast ? ["right"] : [])]}
          >
            <Dropdown.Item id="rename" textValue="Renommer">
              <Pencil className="size-3.5" />
              <Label>Renommer</Label>
            </Dropdown.Item>
            <Dropdown.Item id="add" textValue="Ajouter une carte">
              <Plus className="size-3.5" />
              <Label>Ajouter une carte</Label>
            </Dropdown.Item>
            <Dropdown.Item id="left" textValue="Déplacer à gauche">
              <ChevronLeft className="size-3.5" />
              <Label>Déplacer à gauche</Label>
            </Dropdown.Item>
            <Dropdown.Item id="right" textValue="Déplacer à droite">
              <ChevronRight className="size-3.5" />
              <Label>Déplacer à droite</Label>
            </Dropdown.Item>
            <Dropdown.Item id="delete" textValue="Supprimer la colonne" variant="danger">
              <Trash2 className="size-3.5" />
              <Label>Supprimer la colonne</Label>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  );
}

/** Champ de renommage : Entrée / blur valide, Échap annule (`onDone(undefined)`). */
function ColumnNameInput({ initial, onDone }: { initial: string; onDone: (name: string | undefined) => void }) {
  const [draft, setDraft] = useState(initial);
  const settled = useRef(false);

  function finish(value: string | undefined) {
    if (settled.current) return;
    settled.current = true;
    onDone(value);
  }

  return (
    <Input
      autoFocus
      aria-label="Nom de la colonne"
      value={draft}
      onChange={(e) => setDraft(e.currentTarget.value)}
      onBlur={() => finish(draft)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          finish(draft);
        } else if (e.key === "Escape") {
          e.preventDefault();
          finish(undefined);
        }
      }}
      className="h-7 w-full rounded-lg px-2 py-0 text-[0.963rem] font-semibold"
    />
  );
}
