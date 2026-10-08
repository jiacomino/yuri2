import { useState } from "react";
import { openWithPref } from "@/lib/browserPref";
import { notify } from "@/lib/notify";
import type { BodyProps } from "../types";
import type { LinkItem, LinksState, LinkTab } from "./state";
import { EditableTabs } from "@/components/shared/EditableTabs";
import { LinkDialog, type LinkDialogTarget } from "./LinkDialog";
import { LinkList } from "./LinkList";
import { useStoredTab } from "./useStoredTab";
import { confirmDelete } from "@/lib/confirm";
import { genId } from "@/lib/id";

/** Corps du groupe « Liens » : onglets de liens et séparateurs. */
export function LinksBody({ groupId, value, onChange }: BodyProps<LinksState>) {
  const [activeId, setActiveId] = useStoredTab(`yuri.linksActiveTab.${groupId}`, value.tabs);
  const [dialog, setDialog] = useState<LinkDialogTarget | null>(null);
  const activeTab = value.tabs.find((t) => t.id === activeId);

  const setTabs = (tabs: LinkTab[]) => onChange({ ...value, tabs });
  const updateItems = (tabId: string, fn: (items: LinkItem[]) => LinkItem[]) =>
    setTabs(value.tabs.map((t) => (t.id === tabId ? { ...t, items: fn(t.items) } : t)));

  function addTab(name: string) {
    const id = genId();
    setTabs([...value.tabs, { id, name, items: [] }]);
    setActiveId(id);
  }

  async function removeTab(tabId: string) {
    const tab = value.tabs.find((t) => t.id === tabId);
    if (!tab || value.tabs.length <= 1) return;
    const n = tab.items.filter((i) => i.kind === "link").length;
    const message =
      n > 0
        ? `Supprimer l'onglet « ${tab.name} » et ses ${n} lien${n > 1 ? "s" : ""} ?`
        : `Supprimer l'onglet « ${tab.name} » ?`;
    if (!(await confirmDelete(message))) return;
    setTabs(value.tabs.filter((t) => t.id !== tabId));
  }

  async function openItem(item: LinkItem) {
    try {
      await openWithPref(item.url);
    } catch (err) {
      console.error("Ouverture du lien impossible", err);
      notify({ title: "Impossible d'ouvrir le lien", body: item.url });
    }
  }

  async function copyUrl(item: LinkItem) {
    try {
      await navigator.clipboard.writeText(item.url);
      notify({ title: "URL copiée", body: item.url, kind: "success", durationMs: 3000 });
    } catch {
      notify({ title: "Échec de la copie", body: "Impossible d'accéder au presse-papier.", durationMs: 4000 });
    }
  }

  async function removeItem(tabId: string, item: LinkItem) {
    const what = item.kind === "separator" ? "le séparateur" : "le lien";
    if (!(await confirmDelete(`Supprimer ${what} « ${item.name} » ?`))) return;
    updateItems(tabId, (items) => items.filter((i) => i.id !== item.id));
  }

  function duplicateItem(tabId: string, item: LinkItem) {
    updateItems(tabId, (items) => {
      const idx = items.findIndex((i) => i.id === item.id);
      if (idx < 0) return items;
      return [...items.slice(0, idx + 1), { ...item, id: genId() }, ...items.slice(idx + 1)];
    });
  }

  function submitDialog(name: string, url: string) {
    if (!dialog) return;
    if (dialog.mode === "add") {
      updateItems(dialog.tabId, (items) => [...items, { id: genId(), kind: "link", name, url }]);
    } else {
      const { itemId } = dialog;
      updateItems(dialog.tabId, (items) => items.map((i) => (i.id === itemId ? { ...i, name, url } : i)));
    }
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <EditableTabs
        tabs={value.tabs}
        activeId={activeId}
        onSelect={setActiveId}
        onAdd={addTab}
        onRename={(id, name) => setTabs(value.tabs.map((t) => (t.id === id ? { ...t, name } : t)))}
        onRemove={(id) => void removeTab(id)}
      />

      {activeTab && (
        <LinkList
          key={activeTab.id}
          items={activeTab.items}
          onReorder={(items) => updateItems(activeTab.id, () => items)}
          onOpen={(item) => void openItem(item)}
          onCopyUrl={(item) => void copyUrl(item)}
          onDuplicate={(item) => duplicateItem(activeTab.id, item)}
          onEdit={(item) => setDialog({ mode: "edit", tabId: activeTab.id, itemId: item.id, name: item.name, url: item.url })}
          onRemove={(item) => void removeItem(activeTab.id, item)}
          onRenameSeparator={(item, name) =>
            updateItems(activeTab.id, (items) => items.map((i) => (i.id === item.id ? { ...i, name } : i)))
          }
          onAddLink={() => setDialog({ mode: "add", tabId: activeTab.id })}
          onAddSeparator={(label) =>
            updateItems(activeTab.id, (items) => [...items, { id: genId(), kind: "separator", name: label, url: "" }])
          }
        />
      )}

      <LinkDialog
        target={dialog}
        tabName={dialog ? value.tabs.find((t) => t.id === dialog.tabId)?.name : undefined}
        onClose={() => setDialog(null)}
        onSubmit={submitDialog}
      />
    </div>
  );
}
