import type { BodyProps } from "../types";
import { EditableTabs } from "@/components/shared/EditableTabs";
import { confirmDelete } from "@/lib/confirm";
import { genId } from "@/lib/id";
import type { TextState } from "./state";
import { RichTextEditor } from "./RichTextEditor";

const hasVisibleContent = (html: string) => html.replace(/<[^>]*>/g, "").trim().length > 0;

/** Corps du groupe « Texte » : onglets de notes en texte riche (TipTap). */
export function TextBody({ value, onChange }: BodyProps<TextState>) {
  const activeTab = value.tabs.find((t) => t.id === value.activeTabId) ?? value.tabs[0];

  function setContent(tabId: string, content: string) {
    onChange({ ...value, tabs: value.tabs.map((t) => (t.id === tabId ? { ...t, content } : t)) });
  }

  function addTab(name: string) {
    const id = genId();
    onChange({ tabs: [...value.tabs, { id, name, content: "" }], activeTabId: id });
  }

  async function removeTab(tabId: string) {
    const tab = value.tabs.find((t) => t.id === tabId);
    if (!tab || value.tabs.length <= 1) return;
    const message = hasVisibleContent(tab.content)
      ? `Supprimer l'onglet « ${tab.name} » et son contenu ?`
      : `Supprimer l'onglet « ${tab.name} » ?`;
    if (!(await confirmDelete(message))) return;
    const tabs = value.tabs.filter((t) => t.id !== tabId);
    onChange({ tabs, activeTabId: value.activeTabId === tabId ? tabs[0].id : value.activeTabId });
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <EditableTabs
        tabs={value.tabs}
        activeId={activeTab?.id ?? ""}
        onSelect={(id) => onChange({ ...value, activeTabId: id })}
        onAdd={addTab}
        onRename={(id, name) => onChange({ ...value, tabs: value.tabs.map((t) => (t.id === id ? { ...t, name } : t)) })}
        onRemove={(id) => void removeTab(id)}
      />
      {activeTab && (
        <RichTextEditor
          key={activeTab.id}
          content={activeTab.content}
          onChange={(html) => setContent(activeTab.id, html)}
        />
      )}
    </div>
  );
}
