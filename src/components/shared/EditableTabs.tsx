import { useState } from "react";
import { Button, Dropdown, Label, Tabs } from "@heroui/react";
import { Ellipsis, Pencil, Plus, Trash2 } from "lucide-react";
import { InlineInput } from "@/components/shared/InlineInput";

export type EditableTab = { id: string; name: string };

type EditableTabsProps = {
  tabs: EditableTab[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  /** La confirmation éventuelle est à la charge de l'appelant. */
  onRemove: (id: string) => void;
};

type Mode = { kind: "idle" } | { kind: "add" } | { kind: "rename"; id: string };

/**
 * Barre d'onglets éditable (liens, texte, markdown) : sélection, ajout, renommage
 * (double-clic ou menu) et suppression de l'onglet actif.
 */
export function EditableTabs({ tabs, activeId, onSelect, onAdd, onRename, onRemove }: EditableTabsProps) {
  const [mode, setMode] = useState<Mode>({ kind: "idle" });
  const idle = () => setMode({ kind: "idle" });

  if (mode.kind === "add") {
    return (
      <div className="flex shrink-0 items-center">
        <InlineInput
          ariaLabel="Nom du nouvel onglet"
          placeholder="Nom du nouvel onglet"
          onCommit={(name) => {
            onAdd(name);
            idle();
          }}
          onCancel={idle}
          className="w-full"
        />
      </div>
    );
  }

  if (mode.kind === "rename") {
    const tab = tabs.find((t) => t.id === mode.id);
    return (
      <div className="flex shrink-0 items-center">
        <InlineInput
          ariaLabel="Renommer l'onglet"
          initialValue={tab?.name ?? ""}
          onCommit={(name) => {
            onRename(mode.id, name);
            idle();
          }}
          onCancel={idle}
          className="w-full"
        />
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-end gap-0.5 border-b border-separator">
      {tabs.length > 0 && (
        <Tabs
          variant="secondary"
          selectedKey={activeId}
          onSelectionChange={(key) => onSelect(String(key))}
          className="min-w-0 flex-1 gap-0"
        >
          <Tabs.ListContainer className="border-b-0">
            <Tabs.List aria-label="Onglets" className="gap-4">
              {tabs.map((tab) => (
                <Tabs.Tab key={tab.id} id={tab.id} className="h-auto w-auto px-0 py-2 text-[1rem] font-semibold text-muted data-[selected=true]:text-accent">
                  <span
                    className="max-w-40 truncate"
                    title="Double-cliquer pour renommer"
                    onDoubleClick={() => setMode({ kind: "rename", id: tab.id })}
                  >
                    {tab.name}
                  </span>
                  <Tabs.Indicator />
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
      )}
      {tabs.length === 0 && <span className="flex-1 py-2 text-xs text-muted">Aucun onglet</span>}

      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label="Nouvel onglet"
        onPress={() => setMode({ kind: "add" })}
        className="mb-1 size-7 min-w-7 rounded-lg text-muted hover:text-foreground"
      >
        <Plus className="size-3.5" />
      </Button>

      {tabs.length > 0 && (
        <Dropdown>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label="Options de l'onglet"
            className="mb-1 size-7 min-w-7 rounded-lg text-muted hover:text-foreground"
          >
            <Ellipsis className="size-3.5" />
          </Button>
          <Dropdown.Popover placement="bottom end">
            <Dropdown.Menu
              disabledKeys={tabs.length <= 1 ? ["delete"] : []}
              onAction={(key) => {
                if (!activeId) return;
                if (key === "rename") setMode({ kind: "rename", id: activeId });
                else if (key === "delete") onRemove(activeId);
              }}
            >
              <Dropdown.Item id="rename" textValue="Renommer l'onglet">
                <Pencil className="size-3.5" />
                <Label>Renommer l'onglet</Label>
              </Dropdown.Item>
              <Dropdown.Item id="delete" textValue="Supprimer l'onglet" variant="danger">
                <Trash2 className="size-3.5" />
                <Label>Supprimer l'onglet</Label>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      )}
    </div>
  );
}
