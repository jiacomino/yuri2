import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddCardForm } from "./AddCardForm";
import { ColumnHeader } from "./ColumnHeader";
import { KanbanCardItem } from "./KanbanCardItem";
import type { AppTag, KanbanColumn } from "./state";

type KanbanColumnViewProps = {
  column: KanbanColumn;
  /** Toutes les colonnes (pour le menu « Déplacer vers »). */
  columnsMeta: { id: string; name: string }[];
  apps: AppTag[];
  /** Filtre par application (null = toutes les cartes). */
  filterAppId: string | null;
  isFirst: boolean;
  isLast: boolean;
  isAddingCard: boolean;
  onStartAddCard: () => void;
  onStopAddCard: () => void;
  onAddCard: (title: string, appId?: string) => void;
  onRename: (name: string) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onOpenCard: (cardId: string) => void;
  onMoveCard: (cardId: string, targetColumnId: string) => void;
  onSetCardApp: (cardId: string, appId: string | undefined) => void;
  onRemoveCard: (cardId: string) => void;
  onCreateApp: (name: string, color: string) => string | undefined;
};

/** Colonne : en-tête, zone de dépôt triable, ajout de carte. */
export function KanbanColumnView({
  column,
  columnsMeta,
  apps,
  filterAppId,
  isFirst,
  isLast,
  isAddingCard,
  onStartAddCard,
  onStopAddCard,
  onAddCard,
  onRename,
  onMove,
  onRemove,
  onOpenCard,
  onMoveCard,
  onSetCardApp,
  onRemoveCard,
  onCreateApp,
}: KanbanColumnViewProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const cards = filterAppId ? column.cards.filter((k) => k.appId === filterAppId) : column.cards;
  const otherColumns = columnsMeta.filter((c) => c.id !== column.id);

  return (
    <div
      className={cn(
        "flex w-64 shrink-0 flex-col gap-2 rounded-xl bg-surface-secondary p-2.5 transition-shadow",
        isOver && "ring-2 ring-accent/40",
      )}
    >
      <ColumnHeader
        name={column.name}
        count={cards.length}
        isFirst={isFirst}
        isLast={isLast}
        onRename={onRename}
        onMove={onMove}
        onRemove={onRemove}
        onAddCard={onStartAddCard}
      />

      <div ref={setNodeRef} className="-m-0.5 flex min-h-12 flex-1 flex-col gap-2 overflow-y-auto p-0.5">
        <SortableContext items={cards.map((k) => k.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <KanbanCardItem
              key={card.id}
              card={card}
              apps={apps}
              otherColumns={otherColumns}
              onOpenDetails={() => onOpenCard(card.id)}
              onMoveTo={(target) => onMoveCard(card.id, target)}
              onSetApp={(appId) => onSetCardApp(card.id, appId)}
              onRemove={() => onRemoveCard(card.id)}
            />
          ))}
        </SortableContext>

        {isAddingCard ? (
          <AddCardForm apps={apps} onCreateApp={onCreateApp} onSubmit={onAddCard} onCancel={onStopAddCard} />
        ) : (
          <button
            type="button"
            onClick={onStartAddCard}
            className="flex h-9 w-full shrink-0 items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-border text-[0.8889rem] font-semibold text-muted transition-colors hover:border-accent/50 hover:text-foreground"
          >
            <Plus className="size-3.5" />
            Ajouter une carte
          </button>
        )}
      </div>
    </div>
  );
}
