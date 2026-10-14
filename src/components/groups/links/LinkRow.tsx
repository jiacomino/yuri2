import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { KeyRound } from "lucide-react";
import { hostnameOf } from "@/lib/url";
import { useContextMenuAnchor } from "@/components/shared/useContextMenuAnchor";
import { cn } from "@/lib/utils";
import type { LinkItem } from "./state";
import { DragHandle } from "./DragHandle";
import { Favicon } from "./Favicon";
import { LinkMenu } from "./LinkMenu";

export type LinkRowActions = {
  onOpen: () => void;
  onCopyUrl: () => void;
  onCopyUsername: () => void;
  onCopyPassword: () => void;
  onDuplicate: () => void;
  onEdit: () => void;
  onRemove: () => void;
};

/** Ligne de lien réordonnable : clic = ouvrir, clic droit ou « … » = actions. */
export function LinkRow({ item, onOpen, ...actions }: { item: LinkItem } & LinkRowActions) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnchor = useContextMenuAnchor(() => setMenuOpen(true));

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onContextMenu={menuAnchor.openAt}
      data-active={menuOpen}
      className={cn(
        "list-row group/item flex items-center gap-0.5 rounded-[10px] py-1 pr-1 pl-0.5",
        isDragging && "opacity-40",
      )}
    >
      <DragHandle label={`Déplacer ${item.name}`} {...attributes} {...listeners} />
      <div
        role="button"
        tabIndex={0}
        title={item.url}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg py-1 outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <Favicon url={item.url} />
        <span className="min-w-0 flex-1 truncate font-semibold">{item.name}</span>
        {(item.username || item.password) && (
          <KeyRound className="size-3 shrink-0 text-muted" aria-label="Identifiants enregistrés" />
        )}
        <span className="hidden max-w-[45%] shrink-0 truncate text-[0.8889rem] text-muted @[18rem]:inline">{hostnameOf(item.url)}</span>
      </div>
      <LinkMenu
        name={item.name}
        hasUsername={!!item.username}
        hasPassword={!!item.password}
        isOpen={menuOpen}
        onOpenChange={(open) => {
          setMenuOpen(open);
          if (!open) menuAnchor.reset();
        }}
        anchorRef={menuAnchor.point ? menuAnchor.anchorRef : undefined}
        {...actions}
      />
      {menuAnchor.anchor}
    </li>
  );
}
