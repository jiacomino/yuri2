import { useState } from "react";
import { Button } from "@heroui/react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LinkItem } from "./state";
import { DragHandle } from "./DragHandle";
import { InlineInput } from "@/components/shared/InlineInput";

type SeparatorRowProps = {
  item: LinkItem;
  onRename: (name: string) => void;
  onRemove: () => void;
};

/** Intertitre réordonnable entre les liens, renommable sur place. */
export function SeparatorRow({ item, onRename, onRemove }: SeparatorRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const [editing, setEditing] = useState(false);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("group/item mt-2.5 flex h-8 items-center gap-1.5 pl-0.5 first:mt-0", isDragging && "opacity-40")}
    >
      <DragHandle label={`Déplacer le séparateur ${item.name}`} {...attributes} {...listeners} />
      {editing ? (
        <InlineInput
          ariaLabel="Libellé du séparateur"
          initialValue={item.name}
          onCommit={(name) => {
            onRename(name);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
          className="h-7 flex-1 text-[0.8889rem]"
        />
      ) : (
        <>
          <span
            className="max-w-[70%] shrink-0 truncate pl-1 text-[0.8148rem] font-bold tracking-[.06em] text-muted uppercase"
            title={item.name}
            onDoubleClick={() => setEditing(true)}
          >
            {item.name}
          </span>
          <span className="flex-1" />
          <div className="flex opacity-0 transition-opacity group-hover/item:opacity-100 focus-within:opacity-100">
            <Button isIconOnly size="sm" variant="ghost" aria-label={`Renommer le séparateur ${item.name}`} onPress={() => setEditing(true)}>
              <Pencil className="size-3.5" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label={`Supprimer le séparateur ${item.name}`}
              onPress={onRemove}
              className="hover:text-danger"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </>
      )}
    </li>
  );
}
