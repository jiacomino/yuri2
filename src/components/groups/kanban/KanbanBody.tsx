import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { BodyProps } from "../types";
import { AddColumn } from "./AddColumn";
import { AppsBar } from "./AppsBar";
import { CardContent } from "./CardContent";
import { CardDetailsModal } from "./CardDetailsModal";
import { confirmDelete } from "@/lib/confirm";
import { collisionDetection, moveCard, moveCardToColumn } from "./dnd";
import { KanbanColumnView } from "./KanbanColumnView";
import { nextAppColor } from "./meta";
import { newId, type AppTag, type CardPatch, type KanbanCard, type KanbanState } from "./state";

/** Applique un patch : chaîne vide / « normal » retirent le champ correspondant. */
function applyPatch(card: KanbanCard, patch: CardPatch): KanbanCard {
  const next: KanbanCard = { ...card };
  if (patch.title !== undefined) next.title = patch.title;
  if (patch.description !== undefined) {
    if (patch.description) next.description = patch.description;
    else delete next.description;
  }
  if (patch.priority !== undefined) {
    if (patch.priority !== "normal") next.priority = patch.priority;
    else delete next.priority;
  }
  if (patch.appId !== undefined) {
    if (patch.appId) next.appId = patch.appId;
    else delete next.appId;
  }
  return next;
}

/** Corps du groupe « Kanban » : colonnes, cartes glissables, applications, détails. */
export function KanbanBody({ value, onChange }: BodyProps<KanbanState>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addingInColumnId, setAddingInColumnId] = useState<string | null>(null);
  const [detailsCardId, setDetailsCardId] = useState<string | null>(null);
  const [filterAppId, setFilterAppId] = useState<string | null>(null);

  // Une distance d'activation laisse passer les clics simples (ouvrir les détails).
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const { columns, apps } = value;
  const setColumns = (next: KanbanState["columns"]) => onChange({ ...value, columns: next });

  // ─── Cartes ───────────────────────────────────────────────────────────────
  function addCard(columnId: string, title: string, appId?: string) {
    const card: KanbanCard = { id: newId(), title, ...(appId ? { appId } : {}) };
    setColumns(columns.map((c) => (c.id === columnId ? { ...c, cards: [...c.cards, card] } : c)));
  }

  function updateCard(cardId: string, patch: CardPatch, targetColumnId?: string) {
    let next = columns.map((c) => ({ ...c, cards: c.cards.map((k) => (k.id === cardId ? applyPatch(k, patch) : k)) }));
    if (targetColumnId) next = moveCardToColumn(next, cardId, targetColumnId);
    setColumns(next);
  }

  function removeCard(cardId: string) {
    setColumns(columns.map((c) => ({ ...c, cards: c.cards.filter((k) => k.id !== cardId) })));
  }

  // ─── Colonnes ─────────────────────────────────────────────────────────────
  function addColumn(name: string) {
    setColumns([...columns, { id: newId(), name, cards: [] }]);
  }

  function renameColumn(columnId: string, name: string) {
    setColumns(columns.map((c) => (c.id === columnId ? { ...c, name } : c)));
  }

  function moveColumn(columnId: string, dir: -1 | 1) {
    const idx = columns.findIndex((c) => c.id === columnId);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= columns.length) return;
    setColumns(arrayMove(columns, idx, target));
  }

  async function removeColumn(columnId: string) {
    const col = columns.find((c) => c.id === columnId);
    if (!col) return;
    if (col.cards.length > 0) {
      const n = col.cards.length;
      const ok = await confirmDelete(`Supprimer la colonne « ${col.name} » et ses ${n} carte${n > 1 ? "s" : ""} ?`);
      if (!ok) return;
    }
    setColumns(columns.filter((c) => c.id !== columnId));
  }

  // ─── Applications ─────────────────────────────────────────────────────────
  /** Renvoie l'id de l'application créée pour que l'appelant puisse la sélectionner. */
  function addApp(name: string, color?: string): string | undefined {
    const clean = name.trim();
    if (!clean) return undefined;
    const id = newId();
    onChange({ ...value, apps: [...apps, { id, name: clean, color: color || nextAppColor(apps.length) }] });
    return id;
  }

  function updateApp(appId: string, patch: Partial<Omit<AppTag, "id">>) {
    onChange({ ...value, apps: apps.map((a) => (a.id === appId ? { ...a, ...patch } : a)) });
  }

  /** Supprime l'application et désaffecte les cartes qui la référençaient. */
  async function removeApp(appId: string) {
    const app = apps.find((a) => a.id === appId);
    if (!app) return;
    const used = columns.reduce((n, c) => n + c.cards.filter((k) => k.appId === appId).length, 0);
    if (used > 0) {
      const ok = await confirmDelete(
        `Supprimer l'application « ${app.name} » ? ${used} carte${used > 1 ? "s seront désaffectées" : " sera désaffectée"}.`,
      );
      if (!ok) return;
    }
    if (filterAppId === appId) setFilterAppId(null);
    onChange({
      apps: apps.filter((a) => a.id !== appId),
      columns: columns.map((c) => ({
        ...c,
        cards: c.cards.map((k) => (k.appId === appId ? applyPatch(k, { appId: "" }) : k)),
      })),
    });
  }

  // ─── Glisser-déposer ──────────────────────────────────────────────────────
  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;
    const next = moveCard(columns, String(active.id), String(over.id));
    if (next !== columns) setColumns(next);
  }

  const columnsMeta = columns.map((c) => ({ id: c.id, name: c.name }));
  const allCards = columns.flatMap((c) => c.cards.map((card) => ({ card, columnId: c.id })));
  const activeCard = activeId ? allCards.find((x) => x.card.id === activeId)?.card : undefined;
  const details = detailsCardId ? allCards.find((x) => x.card.id === detailsCardId) : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5">
      <AppsBar
        apps={apps}
        onAddApp={addApp}
        onUpdateApp={updateApp}
        onRemoveApp={(id) => void removeApp(id)}
        filterAppId={filterAppId}
        onFilterChange={setFilterAppId}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="flex min-h-0 flex-1 items-stretch gap-3 overflow-x-auto pb-1">
          {columns.map((col, idx) => (
            <KanbanColumnView
              key={col.id}
              column={col}
              columnsMeta={columnsMeta}
              apps={apps}
              filterAppId={filterAppId}
              isFirst={idx === 0}
              isLast={idx === columns.length - 1}
              isAddingCard={addingInColumnId === col.id}
              onStartAddCard={() => setAddingInColumnId(col.id)}
              onStopAddCard={() => setAddingInColumnId(null)}
              onAddCard={(title, appId) => addCard(col.id, title, appId)}
              onRename={(name) => renameColumn(col.id, name)}
              onMove={(dir) => moveColumn(col.id, dir)}
              onRemove={() => void removeColumn(col.id)}
              onOpenCard={setDetailsCardId}
              onMoveCard={(cardId, target) => setColumns(moveCardToColumn(columns, cardId, target))}
              onSetCardApp={(cardId, appId) => updateCard(cardId, { appId: appId ?? "" })}
              onRemoveCard={removeCard}
              onCreateApp={addApp}
            />
          ))}
          <AddColumn onAdd={addColumn} />
        </div>

        <DragOverlay dropAnimation={null}>
          {activeCard ? (
            <div className="w-60 rotate-[1.5deg] cursor-grabbing rounded-[10px] bg-surface p-2.5 text-[0.963rem] shadow-[0_12px_28px_rgba(16,24,40,.18),0_2px_6px_rgba(16,24,40,.08)] ring-1 ring-accent/20">
              <CardContent card={activeCard} app={apps.find((a) => a.id === activeCard.appId)} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {details && (
        <CardDetailsModal
          key={details.card.id}
          card={details.card}
          columnId={details.columnId}
          columns={columnsMeta}
          apps={apps}
          onCreateApp={addApp}
          onSave={(patch, target) => updateCard(details.card.id, patch, target)}
          onRemove={() => removeCard(details.card.id)}
          onClose={() => setDetailsCardId(null)}
        />
      )}
    </div>
  );
}
