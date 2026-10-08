import { Button, Dropdown, Label, Tabs } from "@heroui/react";
import { ChevronLeft, ChevronRight, Ellipsis, Pencil, Plus, Trash2 } from "lucide-react";
import type { Workspace } from "@/types/workspace";

type WorkspaceTabsProps = {
  workspaces: Workspace[];
  activeId: string | null;
  /** Nombre de composants par espace, affiché dans l'onglet. */
  counts: Record<string, number>;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onEdit: (workspace: Workspace) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onDelete: (workspace: Workspace) => void;
};

/** Onglets des espaces de travail + menu d'actions sur l'espace actif. */
export function WorkspaceTabs({
  workspaces,
  activeId,
  counts,
  onSelect,
  onCreate,
  onEdit,
  onMove,
  onDelete,
}: WorkspaceTabsProps) {
  const index = workspaces.findIndex((w) => w.id === activeId);
  const active = workspaces[index];

  const disabledKeys = [
    ...(index <= 0 ? ["left"] : []),
    ...(index >= workspaces.length - 1 ? ["right"] : []),
    ...(workspaces.length <= 1 ? ["delete"] : []),
  ];

  return (
    <div className="flex min-w-0 items-center gap-1">
      <Tabs
        selectedKey={activeId ?? undefined}
        onSelectionChange={(key) => onSelect(String(key))}
        className="min-w-0 gap-0"
      >
        <Tabs.ListContainer>
          <Tabs.List aria-label="Espaces de travail">
            {workspaces.map((ws) => (
              <Tabs.Tab key={ws.id} id={ws.id} className="h-8 w-auto gap-2 px-3.5 text-[0.963rem] font-semibold">
                <span className="size-2 shrink-0 rounded-full" style={{ background: ws.color ?? "var(--accent)" }} />
                <span className="max-w-44 truncate" onDoubleClick={() => onEdit(ws)}>
                  {ws.name}
                </span>
                <span className="rounded-md bg-default px-1.5 text-[0.8148rem] font-semibold tabular-nums text-muted">{counts[ws.id] ?? 0}</span>
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>

      <Button isIconOnly size="sm" variant="ghost" aria-label="Nouvel espace de travail" onPress={onCreate}>
        <Plus className="size-4" />
      </Button>

      {active && (
        <Dropdown>
          <Button isIconOnly size="sm" variant="ghost" aria-label="Options de l'espace de travail">
            <Ellipsis className="size-4" />
          </Button>
          <Dropdown.Popover placement="bottom start">
            <Dropdown.Menu
              disabledKeys={disabledKeys}
              onAction={(key) => {
                if (key === "edit") onEdit(active);
                else if (key === "left") onMove(active.id, -1);
                else if (key === "right") onMove(active.id, 1);
                else if (key === "delete") onDelete(active);
              }}
            >
              <Dropdown.Item id="edit" textValue="Renommer">
                <Pencil className="size-3.5" />
                <Label>Renommer / couleur…</Label>
              </Dropdown.Item>
              <Dropdown.Item id="left" textValue="Déplacer à gauche">
                <ChevronLeft className="size-3.5" />
                <Label>Déplacer à gauche</Label>
              </Dropdown.Item>
              <Dropdown.Item id="right" textValue="Déplacer à droite">
                <ChevronRight className="size-3.5" />
                <Label>Déplacer à droite</Label>
              </Dropdown.Item>
              <Dropdown.Item id="delete" textValue="Supprimer" variant="danger">
                <Trash2 className="size-3.5" />
                <Label>Supprimer l'espace</Label>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      )}
    </div>
  );
}
