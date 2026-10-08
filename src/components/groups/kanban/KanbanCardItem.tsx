import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { CardContent } from "./CardContent";
import { CardMenu } from "./CardMenu";
import type { AppTag, KanbanCard } from "./state";

type KanbanCardItemProps = {
  card: KanbanCard;
  apps: AppTag[];
  otherColumns: { id: string; name: string }[];
  onOpenDetails: () => void;
  onMoveTo: (columnId: string) => void;
  onSetApp: (appId: string | undefined) => void;
  onRemove: () => void;
};

/**
 * Carte triable : toute la carte se glisse (après 6 px de mouvement), un simple clic
 * ouvre les détails. dnd-kit neutralise le clic qui suit un glisser.
 */
export function KanbanCardItem({ card, apps, otherColumns, onOpenDetails, onMoveTo, onSetApp, onRemove }: KanbanCardItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const app = apps.find((a) => a.id === card.appId);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      aria-label={`Carte ${card.title}`}
      onClick={onOpenDetails}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onOpenDetails();
        }
      }}
      className={cn(
        "group/card relative cursor-pointer touch-none rounded-[10px] bg-surface p-2.5 text-[0.963rem] outline-none",
        "list-card shadow-[0_1px_2px_rgba(16,24,40,.08)]",
        "focus-visible:ring-2 focus-visible:ring-accent/50",
        isDragging && "opacity-40 shadow-none",
      )}
    >
      <CardContent card={card} app={app} />
      {/* Bloque clics, touches et pointeurs (y compris depuis le popover, via le portail React)
          pour ne ni ouvrir les détails ni démarrer un glisser. */}
      <div
        className="absolute right-1 top-1"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <CardMenu
          cardTitle={card.title}
          appId={card.appId}
          otherColumns={otherColumns}
          apps={apps}
          onOpenDetails={onOpenDetails}
          onMoveTo={onMoveTo}
          onSetApp={onSetApp}
          onRemove={onRemove}
          className="opacity-0 group-hover/card:opacity-100 focus-visible:opacity-100 data-[pressed=true]:opacity-100"
        />
      </div>
    </div>
  );
}
