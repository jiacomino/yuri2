import type { RefObject } from "react";
import { Button, Dropdown, Label, Separator } from "@heroui/react";
import { Ellipsis, FolderOpen, Pencil, Play, ShieldCheck, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type AppMenuActions = {
  onLaunch: () => void;
  onLaunchAdmin: () => void;
  /** Absent quand le chemin n'est pas un fichier (Store, URI). */
  onReveal?: () => void;
  onEdit: () => void;
  onRemove: () => void;
};

type AppMenuProps = AppMenuActions & {
  name: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Repère sous le curseur quand le menu est ouvert par clic droit. */
  anchorRef?: RefObject<Element | null>;
  className?: string;
};

/** Menu d'actions d'une application (bouton « … », ouvert aussi au clic droit). */
export function AppMenu({ name, isOpen, onOpenChange, anchorRef, className, ...actions }: AppMenuProps) {
  return (
    <Dropdown isOpen={isOpen} onOpenChange={onOpenChange}>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label={`Actions pour ${name}`}
        className={cn(
          "size-6 min-w-6 rounded-md text-muted opacity-0 transition-opacity group-hover/app:opacity-100 hover:text-foreground focus-visible:opacity-100",
          isOpen && "opacity-100",
          className,
        )}
      >
        <Ellipsis className="size-3.5" />
      </Button>
      <Dropdown.Popover {...(anchorRef ? { triggerRef: anchorRef, placement: "bottom start" } : { placement: "bottom end" })}>
        <Dropdown.Menu
          onAction={(key) => {
            if (key === "launch") actions.onLaunch();
            else if (key === "admin") actions.onLaunchAdmin();
            else if (key === "reveal") actions.onReveal?.();
            else if (key === "edit") actions.onEdit();
            else if (key === "delete") actions.onRemove();
          }}
        >
          <Dropdown.Item id="launch" textValue="Lancer">
            <Play className="size-3.5" />
            <Label>Lancer</Label>
          </Dropdown.Item>
          <Dropdown.Item id="admin" textValue="Lancer en administrateur">
            <ShieldCheck className="size-3.5" />
            <Label>Lancer en administrateur</Label>
          </Dropdown.Item>
          {actions.onReveal && (
            <Dropdown.Item id="reveal" textValue="Ouvrir l'emplacement">
              <FolderOpen className="size-3.5" />
              <Label>Ouvrir l'emplacement</Label>
            </Dropdown.Item>
          )}
          <Dropdown.Item id="edit" textValue="Modifier">
            <Pencil className="size-3.5" />
            <Label>Modifier</Label>
          </Dropdown.Item>
          <Separator />
          <Dropdown.Item id="delete" textValue="Retirer" variant="danger">
            <Trash2 className="size-3.5" />
            <Label>Retirer</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
