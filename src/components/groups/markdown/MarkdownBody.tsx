import type { BodyProps } from "../types";
import { EditableTabs } from "@/components/shared/EditableTabs";
import { confirmDelete } from "@/lib/confirm";
import { genId } from "@/lib/id";
import type { MarkdownState } from "./state";
import { MarkdownEditor } from "./MarkdownEditor";
import { MarkdownPreview } from "./MarkdownPreview";
import { ViewModeSwitch } from "./ViewModeSwitch";

/** Corps du groupe « Markdown » : onglets, modes édition / scindé / aperçu. */
export function MarkdownBody({ value, onChange }: BodyProps<MarkdownState>) {
  const activeTab = value.tabs.find((t) => t.id === value.activeTabId) ?? value.tabs[0];

  function setText(text: string) {
    if (!activeTab) return;
    onChange({ ...value, tabs: value.tabs.map((t) => (t.id === activeTab.id ? { ...t, text } : t)) });
  }

  function addTab(name: string) {
    const id = genId();
    onChange({ ...value, tabs: [...value.tabs, { id, name, text: "" }], activeTabId: id });
  }

  async function removeTab(tabId: string) {
    const tab = value.tabs.find((t) => t.id === tabId);
    if (!tab || value.tabs.length <= 1) return;
    const message = tab.text.trim()
      ? `Supprimer l'onglet « ${tab.name} » et son contenu ?`
      : `Supprimer l'onglet « ${tab.name} » ?`;
    if (!(await confirmDelete(message))) return;
    const tabs = value.tabs.filter((t) => t.id !== tabId);
    onChange({ ...value, tabs, activeTabId: value.activeTabId === tabId ? tabs[0].id : value.activeTabId });
  }

  const text = activeTab?.text ?? "";

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

      <div className="flex shrink-0 items-center gap-2 rounded-[10px] bg-surface-secondary p-1">
        <ViewModeSwitch mode={value.mode} onChange={(mode) => onChange({ ...value, mode })} />
        <span className="flex-1" />
        <span className="pr-2 text-[0.8889rem] font-semibold text-muted tabular-nums">{text.length} car.</span>
      </div>

      {activeTab && value.mode === "edit" && <MarkdownEditor key={activeTab.id} value={text} onChange={setText} />}
      {activeTab && value.mode === "preview" && <MarkdownPreview text={text} />}
      {activeTab && value.mode === "split" && (
        <div className="flex min-h-0 flex-1 gap-3">
          <MarkdownEditor key={activeTab.id} value={text} onChange={setText} className="min-w-0" />
          <MarkdownPreview text={text} className="min-w-0 rounded-none border-l border-separator pl-3" />
        </div>
      )}
    </div>
  );
}
