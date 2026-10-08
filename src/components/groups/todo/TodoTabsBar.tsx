import { useState, type Key } from "react";
import { Button, Dropdown, Label, Tabs } from "@heroui/react";
import { ChevronLeft, ChevronRight, Ellipsis, Pencil, Plus, Trash2 } from "lucide-react";
import type { TodoTab } from "./state";
import { InlineInput } from "./InlineInput";

type TodoTabsBarProps = {
  tabs: TodoTab[];
  activeTabId: string;
  onSelect: (tabId: string) => void;
  onAdd: (name: string) => void;
  onRename: (tabId: string, name: string) => void;
  onMove: (tabId: string, dir: -1 | 1) => void;
  onRemove: (tabId: string) => void;
};

type Mode = { kind: "idle" } | { kind: "adding" } | { kind: "renaming"; tabId: string };

/** Barre d'onglets : sélection, ajout, et menu (renommer / déplacer / supprimer) de l'onglet actif. */
export function TodoTabsBar({ tabs, activeTabId, onSelect, onAdd, onRename, onMove, onRemove }: TodoTabsBarProps) {
  const [mode, setMode] = useState<Mode>({ kind: "idle" });
  const activeIndex = tabs.findIndex((t) => t.id === activeTabId);
  const active = tabs[activeIndex];

  if (mode.kind !== "idle") {
    const renaming = mode.kind === "renaming" ? tabs.find((t) => t.id === mode.tabId) : undefined;
    return (
      <div className="flex h-9 items-center">
        <InlineInput
          initial={renaming?.name ?? ""}
          placeholder={renaming ? "Nom de l'onglet" : "Nouvel onglet…"}
          ariaLabel={renaming ? "Renommer l'onglet" : "Nom du nouvel onglet"}
          cancelOnBlur
          onCommit={(text) => {
            const clean = text.trim();
            if (clean) {
              if (renaming) onRename(renaming.id, clean);
              else onAdd(clean);
            }
            setMode({ kind: "idle" });
          }}
          onCancel={() => setMode({ kind: "idle" })}
        />
      </div>
    );
  }

  function handleAction(key: Key) {
    if (!active) return;
    if (key === "rename") setMode({ kind: "renaming", tabId: active.id });
    else if (key === "left") onMove(active.id, -1);
    else if (key === "right") onMove(active.id, 1);
    else if (key === "delete") onRemove(active.id);
  }

  return (
    <div className="flex shrink-0 items-center gap-1 border-b border-separator">
      <div className="min-w-0 flex-1 overflow-x-auto">
        <Tabs variant="secondary" selectedKey={activeTabId} onSelectionChange={(key) => onSelect(String(key))}>
          <Tabs.ListContainer className="border-b-0">
            <Tabs.List aria-label="Onglets de tâches" className="w-max min-w-0 gap-4 p-0">
              {tabs.map((tab) => {
                const remaining = tab.items.filter((i) => !i.done).length;
                return (
                  <Tabs.Tab key={tab.id} id={tab.id} className="h-9 w-auto gap-1.5 px-0 text-[0.963rem] font-semibold text-muted data-[selected=true]:text-accent">
                    <span className="max-w-32 truncate">{tab.name}</span>
                    {remaining > 0 && (
                      <span className="rounded-md bg-default px-1.5 text-[0.8148rem] font-bold tabular-nums text-muted">{remaining}</span>
                    )}
                    <Tabs.Indicator />
                  </Tabs.Tab>
                );
              })}
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
      </div>

      <Dropdown>
        <Button isIconOnly size="sm" variant="ghost" aria-label="Options de l'onglet" className="size-7 min-w-7">
          <Ellipsis className="size-3.5" />
        </Button>
        <Dropdown.Popover placement="bottom end">
          <Dropdown.Menu
            onAction={handleAction}
            disabledKeys={[
              ...(activeIndex <= 0 ? ["left"] : []),
              ...(activeIndex >= tabs.length - 1 ? ["right"] : []),
              ...(tabs.length <= 1 ? ["delete"] : []),
            ]}
          >
            <Dropdown.Item id="rename" textValue="Renommer">
              <Pencil className="size-3.5" />
              <Label>Renommer</Label>
            </Dropdown.Item>
            <Dropdown.Item id="left" textValue="Déplacer à gauche">
              <ChevronLeft className="size-3.5" />
              <Label>Déplacer à gauche</Label>
            </Dropdown.Item>
            <Dropdown.Item id="right" textValue="Déplacer à droite">
              <ChevronRight className="size-3.5" />
              <Label>Déplacer à droite</Label>
            </Dropdown.Item>
            <Dropdown.Item id="delete" textValue="Supprimer l'onglet" variant="danger">
              <Trash2 className="size-3.5" />
              <Label>Supprimer l'onglet</Label>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>

      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label="Nouvel onglet"
        className="size-7 min-w-7"
        onPress={() => setMode({ kind: "adding" })}
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  );
}
