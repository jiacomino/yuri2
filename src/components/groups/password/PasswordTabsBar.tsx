import { useState } from "react";
import { Button, Dropdown, Label, Tabs } from "@heroui/react";
import { Ellipsis, Pencil, Plus, Trash2 } from "lucide-react";
import { TabNameModal } from "./TabNameModal";
import type { PasswordTab } from "./state";

type PasswordTabsBarProps = {
  tabs: PasswordTab[];
  activeTabId: string;
  onSelect: (id: string) => void;
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
};

type NameDialog = { mode: "add" } | { mode: "rename"; tab: PasswordTab } | null;

/** Onglets de classement des identifiants, avec ajout, renommage et suppression. */
export function PasswordTabsBar({ tabs, activeTabId, onSelect, onAdd, onRename, onRemove }: PasswordTabsBarProps) {
  const [dialog, setDialog] = useState<NameDialog>(null);
  const active = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  return (
    <div className="flex shrink-0 items-end gap-0.5 border-b border-separator">
      <Tabs
        variant="secondary"
        selectedKey={active?.id}
        onSelectionChange={(key) => onSelect(String(key))}
        className="min-w-0 flex-1 gap-0"
      >
        <Tabs.ListContainer className="border-b-0">
          <Tabs.List aria-label="Onglets d'identifiants" className="gap-4">
            {tabs.map((tab) => (
              <Tabs.Tab
                key={tab.id}
                id={tab.id}
                className="h-auto w-auto px-0 py-2 text-[1rem] font-semibold text-muted data-[selected=true]:text-accent"
              >
                {tab.name}
                {tab.entries.length > 0 && (
                  <span className="ml-1.5 rounded-md bg-default px-1.5 text-[0.8148rem] font-bold text-muted tabular-nums">
                    {tab.entries.length}
                  </span>
                )}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>

      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label="Nouvel onglet"
        onPress={() => setDialog({ mode: "add" })}
        className="mb-1 size-7 min-w-7 rounded-lg text-muted hover:text-foreground"
      >
        <Plus className="size-3.5" />
      </Button>

      {active && (
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
          <Dropdown.Popover>
            <Dropdown.Menu
              disabledKeys={tabs.length <= 1 ? ["delete"] : []}
              onAction={(key) => {
                if (key === "rename") setDialog({ mode: "rename", tab: active });
                else if (key === "delete") onRemove(active.id);
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

      <TabNameModal
        isOpen={dialog !== null}
        title={dialog?.mode === "rename" ? "Renommer l'onglet" : "Nouvel onglet"}
        initialName={dialog?.mode === "rename" ? dialog.tab.name : ""}
        submitLabel={dialog?.mode === "rename" ? "Renommer" : "Créer"}
        onSubmit={(name) => {
          if (dialog?.mode === "rename") onRename(dialog.tab.id, name);
          else onAdd(name);
        }}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}
