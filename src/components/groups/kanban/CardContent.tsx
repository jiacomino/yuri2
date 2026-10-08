import { AppBadge } from "./AppBadge";
import { PriorityBadge } from "./PriorityBadge";
import type { AppTag, KanbanCard } from "./state";

type CardContentProps = {
  card: KanbanCard;
  app?: AppTag;
};

/** Rendu visuel d'une carte (partagé par la carte et son aperçu de glisser). */
export function CardContent({ card, app }: CardContentProps) {
  const showPriority = card.priority && card.priority !== "normal";
  return (
    <>
      <p className="m-0 whitespace-pre-wrap break-words pr-5 font-semibold leading-snug">{card.title}</p>
      {card.description && (
        <p className="m-0 mt-1 line-clamp-3 whitespace-pre-wrap break-words text-[0.8889rem] leading-snug text-muted">
          {card.description}
        </p>
      )}
      {(showPriority || app) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          {showPriority && <PriorityBadge priority={card.priority!} />}
          {app && <AppBadge app={app} />}
        </div>
      )}
    </>
  );
}
