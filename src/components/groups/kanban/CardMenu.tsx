import type { Key } from "react";
import { Button, Dropdown, Header, Label } from "@heroui/react";
import { ArrowRight, Check, Ellipsis, PanelRightOpen, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppTag } from "./state";

type CardMenuProps = {
  cardTitle: string;
  appId?: string;
  /** Autres colonnes (destinations possibles). */
  otherColumns: { id: string; name: string }[];
  apps: AppTag[];
  onOpenDetails: () => void;
  onMoveTo: (columnId: string) => void;
  onSetApp: (appId: string | undefined) => void;
  onRemove: () => void;
  className?: string;
};

/** Menu « … » d'une carte : détails, déplacer vers, application, supprimer. */
export function CardMenu({
  cardTitle,
  appId,
  otherColumns,
  apps,
  onOpenDetails,
  onMoveTo,
  onSetApp,
  onRemove,
  className,
}: CardMenuProps) {
  function handleAction(key: Key) {
    const k = String(key);
    if (k === "details") onOpenDetails();
    else if (k === "delete") onRemove();
    else if (k.startsWith("move:")) onMoveTo(k.slice(5));
    else if (k === "app:none") onSetApp(undefined);
    else if (k.startsWith("app:")) onSetApp(k.slice(4));
  }

  return (
    <Dropdown>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label={`Actions pour ${cardTitle}`}
        className={cn("size-6 min-w-6 text-muted", className)}
      >
        <Ellipsis className="size-3.5" />
      </Button>
      <Dropdown.Popover placement="bottom end" className="min-w-48">
        <Dropdown.Menu aria-label="Actions de la carte" onAction={handleAction}>
          <Dropdown.Section>
            <Dropdown.Item id="details" textValue="Ouvrir les détails">
              <PanelRightOpen className="size-3.5" />
              <Label>Ouvrir les détails</Label>
            </Dropdown.Item>
          </Dropdown.Section>

          {otherColumns.length > 0 ? (
            <Dropdown.Section>
              <Header>Déplacer vers</Header>
              {otherColumns.map((c) => (
                <Dropdown.Item key={c.id} id={`move:${c.id}`} textValue={c.name}>
                  <ArrowRight className="size-3.5" />
                  <Label>{c.name}</Label>
                </Dropdown.Item>
              ))}
            </Dropdown.Section>
          ) : null}

          {apps.length > 0 ? (
            <Dropdown.Section>
              <Header>Application</Header>
              <Dropdown.Item id="app:none" textValue="Aucune">
                <span className="size-2 rounded-full border border-border" />
                <Label className="flex-1">Aucune</Label>
                {!appId && <Check className="size-3.5 text-muted" />}
              </Dropdown.Item>
              {apps.map((a) => (
                <Dropdown.Item key={a.id} id={`app:${a.id}`} textValue={a.name}>
                  <span className="size-2 rounded-full" style={{ backgroundColor: a.color }} />
                  <Label className="flex-1 truncate">{a.name}</Label>
                  {appId === a.id && <Check className="size-3.5 text-muted" />}
                </Dropdown.Item>
              ))}
            </Dropdown.Section>
          ) : null}

          <Dropdown.Section>
            <Dropdown.Item id="delete" textValue="Supprimer" variant="danger">
              <Trash2 className="size-3.5" />
              <Label>Supprimer</Label>
            </Dropdown.Item>
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
