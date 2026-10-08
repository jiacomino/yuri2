import type { RefObject } from "react";
import { Button, Dropdown, Label, Separator } from "@heroui/react";
import { Copy, Ellipsis, ExternalLink, Eye, EyeOff, Pencil, Trash2, User } from "lucide-react";

export type EntryAction = "copy-password" | "copy-username" | "copy-url" | "open-url" | "toggle-reveal" | "edit" | "delete";

type EntryMenuProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Repère sous le curseur quand le menu est ouvert par clic droit. */
  anchorRef?: RefObject<Element | null>;
  hasUrl: boolean;
  revealed: boolean;
  onAction: (action: EntryAction) => void;
};

/** Menu « … » d'un identifiant (aussi ouvert par clic droit sur la ligne). */
export function EntryMenu({ isOpen, onOpenChange, anchorRef, hasUrl, revealed, onAction }: EntryMenuProps) {
  return (
    <Dropdown isOpen={isOpen} onOpenChange={onOpenChange}>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label="Actions de l'identifiant"
        className="size-7 min-w-7 rounded-lg text-muted hover:text-foreground"
      >
        <Ellipsis className="size-3.5" />
      </Button>
      <Dropdown.Popover {...(anchorRef ? { triggerRef: anchorRef, placement: "bottom start" } : { placement: "bottom end" })}>
        <Dropdown.Menu onAction={(key) => onAction(key as EntryAction)}>
          <Dropdown.Item id="copy-password" textValue="Copier le mot de passe">
            <Copy className="size-3.5" />
            <Label>Copier le mot de passe</Label>
          </Dropdown.Item>
          <Dropdown.Item id="copy-username" textValue="Copier le nom d'utilisateur">
            <User className="size-3.5" />
            <Label>Copier le nom d'utilisateur</Label>
          </Dropdown.Item>
          {hasUrl && (
            <Dropdown.Item id="copy-url" textValue="Copier l'adresse">
              <Copy className="size-3.5" />
              <Label>Copier l'adresse</Label>
            </Dropdown.Item>
          )}
          {hasUrl && (
            <Dropdown.Item id="open-url" textValue="Ouvrir l'adresse">
              <ExternalLink className="size-3.5" />
              <Label>Ouvrir l'adresse</Label>
            </Dropdown.Item>
          )}
          <Separator />
          <Dropdown.Item id="toggle-reveal" textValue={revealed ? "Masquer" : "Afficher"}>
            {revealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            <Label>{revealed ? "Masquer le mot de passe" : "Afficher le mot de passe"}</Label>
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
