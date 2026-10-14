import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Link2 } from "lucide-react";
import type { LinkItem } from "./state";
import { AddItemBar } from "./AddItemBar";
import { DragGhost } from "./DragGhost";
import { LinkRow } from "./LinkRow";
import { SeparatorRow } from "./SeparatorRow";

type LinkListProps = {
  items: LinkItem[];
  onReorder: (items: LinkItem[]) => void;
  onOpen: (item: LinkItem) => void;
  onCopyUrl: (item: LinkItem) => void;
  onCopyUsername: (item: LinkItem) => void;
  onCopyPassword: (item: LinkItem) => void;
  onDuplicate: (item: LinkItem) => void;
  onEdit: (item: LinkItem) => void;
  onRemove: (item: LinkItem) => void;
  onRenameSeparator: (item: LinkItem, name: string) => void;
  onAddLink: () => void;
  onAddSeparator: (label: string) => void;
};

/** Liste réordonnable (glisser-déposer) des liens et séparateurs d'un onglet. */
export function LinkList({
  items,
  onReorder,
  onOpen,
  onCopyUrl,
  onCopyUsername,
  onCopyPassword,
  onDuplicate,
  onEdit,
  onRemove,
  onRenameSeparator,
  onAddLink,
  onAddSeparator,
}: LinkListProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  // Une petite distance d'activation laisse les clics (ouvrir, menu) fonctionner.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const dragging = draggingId ? (items.find((i) => i.id === draggingId) ?? null) : null;

  function handleDragEnd({ active, over }: DragEndEvent) {
    setDraggingId(null);
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(items, from, to));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="@container min-h-0 flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <span className="grid size-10 place-items-center rounded-xl bg-accent/10 text-accent">
              <Link2 className="size-5" />
            </span>
            <p className="text-[0.8889rem] text-muted">Aucun lien dans cet onglet.</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={({ active }) => setDraggingId(String(active.id))}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setDraggingId(null)}
          >
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
                {items.map((item) =>
                  item.kind === "separator" ? (
                    <SeparatorRow
                      key={item.id}
                      item={item}
                      onRename={(name) => onRenameSeparator(item, name)}
                      onRemove={() => onRemove(item)}
                    />
                  ) : (
                    <LinkRow
                      key={item.id}
                      item={item}
                      onOpen={() => onOpen(item)}
                      onCopyUrl={() => onCopyUrl(item)}
                      onCopyUsername={() => onCopyUsername(item)}
                      onCopyPassword={() => onCopyPassword(item)}
                      onDuplicate={() => onDuplicate(item)}
                      onEdit={() => onEdit(item)}
                      onRemove={() => onRemove(item)}
                    />
                  ),
                )}
              </ul>
            </SortableContext>
            <DragOverlay dropAnimation={null}>{dragging ? <DragGhost item={dragging} /> : null}</DragOverlay>
          </DndContext>
        )}
      </div>
      <AddItemBar onAddLink={onAddLink} onAddSeparator={onAddSeparator} />
    </div>
  );
}
