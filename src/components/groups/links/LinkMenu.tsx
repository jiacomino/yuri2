import type { RefObject } from "react";
import { Button, Dropdown, Label, Separator } from "@heroui/react";
import { Copy, Ellipsis, Files, KeyRound, Pencil, Trash2, User } from "lucide-react";
import { cn } from "@/lib/utils";

type LinkMenuProps = {
  name: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Repère sous le curseur quand le menu est ouvert par clic droit. */
  anchorRef?: RefObject<Element | null>;
  /** Les entrées de copie sont grisées tant que le lien n'a pas d'identifiant / mot de passe. */
  hasUsername: boolean;
  hasPassword: boolean;
  onCopyUrl: () => void;
  onCopyUsername: () => void;
  onCopyPassword: () => void;
  onDuplicate: () => void;
  onEdit: () => void;
  onRemove: () => void;
};

/** Menu d'actions d'un lien (bouton « … », ouvert aussi au clic droit sur la ligne). */
export function LinkMenu({
  name,
  isOpen,
  onOpenChange,
  anchorRef,
  hasUsername,
  hasPassword,
  onCopyUrl,
  onCopyUsername,
  onCopyPassword,
  onDuplicate,
  onEdit,
  onRemove,
}: LinkMenuProps) {
  return (
    <Dropdown isOpen={isOpen} onOpenChange={onOpenChange}>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label={`Actions pour ${name}`}
        className={cn(
          "size-7 min-w-7 rounded-lg text-muted opacity-0 transition-opacity group-hover/item:opacity-100 hover:text-foreground focus-visible:opacity-100",
          isOpen && "opacity-100",
        )}
      >
        <Ellipsis className="size-3.5" />
      </Button>
      <Dropdown.Popover {...(anchorRef ? { triggerRef: anchorRef, placement: "bottom start" } : { placement: "bottom end" })}>
        <Dropdown.Menu
          onAction={(key) => {
            if (key === "copy") onCopyUrl();
            else if (key === "copy-username") onCopyUsername();
            else if (key === "copy-password") onCopyPassword();
            else if (key === "duplicate") onDuplicate();
            else if (key === "edit") onEdit();
            else if (key === "delete") onRemove();
          }}
          disabledKeys={[...(hasUsername ? [] : ["copy-username"]), ...(hasPassword ? [] : ["copy-password"])]}
        >
          <Dropdown.Item id="copy" textValue="Copier l'URL">
            <Copy className="size-3.5" />
            <Label>Copier l'URL</Label>
          </Dropdown.Item>
          <Dropdown.Item id="copy-username" textValue="Copier le nom d'utilisateur">
            <User className="size-3.5" />
            <Label>Copier le nom d'utilisateur</Label>
          </Dropdown.Item>
          <Dropdown.Item id="copy-password" textValue="Copier le mot de passe">
            <KeyRound className="size-3.5" />
            <Label>Copier le mot de passe</Label>
          </Dropdown.Item>
          <Dropdown.Item id="duplicate" textValue="Dupliquer le lien">
            <Files className="size-3.5" />
            <Label>Dupliquer le lien</Label>
          </Dropdown.Item>
          <Dropdown.Item id="edit" textValue="Modifier">
            <Pencil className="size-3.5" />
            <Label>Modifier</Label>
          </Dropdown.Item>
          <Separator />
          <Dropdown.Item id="delete" textValue="Supprimer" variant="danger">
            <Trash2 className="size-3.5" />
            <Label>Supprimer</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
