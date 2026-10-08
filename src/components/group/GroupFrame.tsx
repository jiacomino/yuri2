import type { CSSProperties, ReactNode } from "react";
import { Button, Chip, Dropdown, Label } from "@heroui/react";
import { Ellipsis, Minus, Settings2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type GroupFrameProps = {
  title: string;
  icon: ReactNode;
  /** Couleur du groupe (hex), teinte de la pastille d'icône. */
  color: string;
  tags?: string[];
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onMinimize?: () => void;
  /** Ouvre la fenêtre de réglages (nom, couleur, tags, espace). */
  onEdit?: () => void;
  onDelete?: () => void;
  /** Clic sur un tag : filtre l'espace sur ce tag. */
  onTagClick?: (tag: string) => void;
};

/**
 * Cadre commun à tous les types de groupe (style « moderne coloré ») : carte blanche à
 * ombre douce, pastille d'icône teintée de la couleur du groupe, titre, tags et actions. La barre de titre porte la classe
 * `group-handle`, poignée de déplacement sur le canevas.
 */
export function GroupFrame({
  title,
  icon,
  color,
  tags = [],
  children,
  className,
  style,
  onMinimize,
  onEdit,
  onDelete,
  onTagClick,
}: GroupFrameProps) {
  return (
    <section
      style={{ ...style, ["--group-tint" as string]: color }}
      className={cn(
        "group-frame group/frame flex flex-col overflow-hidden rounded-[18px] bg-surface ring-1 ring-black/[.04] dark:ring-white/[.06]",
        "shadow-[0_1px_2px_rgba(16,24,40,.04),0_8px_24px_-4px_rgba(16,24,40,.08)] transition-shadow duration-200",
        "hover:shadow-[0_1px_2px_rgba(16,24,40,.05),0_14px_32px_-6px_rgba(16,24,40,.14)]",
        className,
      )}
    >
      <header className="group-handle group-header flex h-13 shrink-0 cursor-grab items-center gap-2.5 px-4 active:cursor-grabbing">
        <span
          className="grid size-[30px] shrink-0 place-items-center rounded-[9px]"
          style={{
            // Fond opaque : la pastille reste lisible sur la barre de titre pastel.
            background: `color-mix(in oklab, ${color} 12%, var(--surface))`,            color: `color-mix(in oklab, ${color} 80%, var(--foreground))`,
          }}
        >
          {icon}
        </span>

        <h3
          className="truncate text-[1.037rem] font-bold tracking-[-0.01em]"
          // Couleur du composant foncée (éclaircie en mode sombre, le texte y étant clair).
          style={{ color: `color-mix(in oklab, ${color} 40%, var(--foreground))` }}
          onDoubleClick={onEdit}
        >
          {title}
        </h3>

        <div className="flex min-w-0 gap-1 overflow-hidden">
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              title={`Filtrer sur #${t}`}
              onClick={() => onTagClick?.(t)}
              className="group-tag shrink-0 cursor-pointer"
            >
              <Chip size="sm" variant="soft">
                #{t}
              </Chip>
            </button>
          ))}
        </div>

        <div className="group-actions ml-auto flex shrink-0 items-center opacity-0 transition-opacity group-hover/frame:opacity-100 focus-within:opacity-100">
          {onMinimize && (
            <Button isIconOnly size="sm" variant="ghost" aria-label="Réduire" onPress={onMinimize}>
              <Minus className="size-3.5" />
            </Button>
          )}
          {(onEdit || onDelete) && <GroupMenu onEdit={onEdit} onDelete={onDelete} />}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto px-4 pb-4">{children}</div>
    </section>
  );
}

function GroupMenu({ onEdit, onDelete }: Pick<GroupFrameProps, "onEdit" | "onDelete">) {
  return (
    <Dropdown>
      <Button isIconOnly size="sm" variant="ghost" aria-label="Options du composant">
        <Ellipsis className="size-3.5" />
      </Button>
      <Dropdown.Popover placement="bottom end">
        <Dropdown.Menu
          onAction={(key) => {
            if (key === "edit") onEdit?.();
            else if (key === "delete") onDelete?.();
          }}
        >
          <Dropdown.Item id="edit" textValue="Réglages">
            <Settings2 className="size-3.5" />
            <Label>Réglages…</Label>
          </Dropdown.Item>
          <Dropdown.Item id="delete" textValue="Supprimer" variant="danger">
            <Trash2 className="size-3.5" />
            <Label>Supprimer</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
