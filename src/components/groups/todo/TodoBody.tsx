import { arrayMove } from "@dnd-kit/sortable";
import type { BodyProps } from "../types";
import { confirmDelete } from "@/lib/confirm";
import { newId, type TodoItem, type TodoState, type TodoSubtask } from "./state";
import { TodoAddForm } from "./TodoAddForm";
import { TodoFooter } from "./TodoFooter";
import type { TodoItemActions } from "./TodoItemRow";
import { TodoList } from "./TodoList";
import { TodoTabsBar } from "./TodoTabsBar";
import { useTodoAlarms } from "./useTodoAlarms";

/** Corps du groupe « Tâches » : onglets de listes, priorités, sous-tâches, alarmes. */
export function TodoBody({ value, onChange }: BodyProps<TodoState>) {
  useTodoAlarms(value, onChange);

  const activeTab = value.tabs.find((t) => t.id === value.activeTabId) ?? value.tabs[0];
  const items = activeTab?.items ?? [];

  /** Applique `fn` aux tâches de l'onglet actif. */
  function updateItems(fn: (items: TodoItem[]) => TodoItem[]) {
    if (!activeTab) return;
    onChange({
      ...value,
      tabs: value.tabs.map((t) => (t.id === activeTab.id ? { ...t, items: fn(t.items) } : t)),
    });
  }

  function updateItem(id: string, fn: (item: TodoItem) => TodoItem) {
    updateItems((list) => list.map((i) => (i.id === id ? fn(i) : i)));
  }

  function removeItem(id: string) {
    updateItems((list) => list.filter((i) => i.id !== id));
  }

  function updateSubtasks(itemId: string, fn: (subs: TodoSubtask[]) => TodoSubtask[]) {
    updateItem(itemId, (i) => {
      const next = fn(i.subtasks ?? []);
      return { ...i, subtasks: next.length > 0 ? next : undefined };
    });
  }

  function actionsFor(item: TodoItem): TodoItemActions {
    return {
      onToggle: () => updateItem(item.id, (i) => ({ ...i, done: !i.done })),
      onUpdate: (text) => {
        const clean = text.trim();
        if (!clean) removeItem(item.id);
        else updateItem(item.id, (i) => ({ ...i, text: clean }));
      },
      onRemove: () => removeItem(item.id),
      onSetAlarm: (alarmAt) => updateItem(item.id, (i) => ({ ...i, alarmAt, alarmFired: false })),
      onSetPriority: (priority) => updateItem(item.id, (i) => ({ ...i, priority })),
      onAddSubtask: (text) => updateSubtasks(item.id, (subs) => [...subs, { id: newId(), text, done: false }]),
      onToggleSubtask: (subId) =>
        updateSubtasks(item.id, (subs) => subs.map((s) => (s.id === subId ? { ...s, done: !s.done } : s))),
      onUpdateSubtask: (subId, text) => {
        const clean = text.trim();
        updateSubtasks(item.id, (subs) =>
          clean ? subs.map((s) => (s.id === subId ? { ...s, text: clean } : s)) : subs.filter((s) => s.id !== subId),
        );
      },
      onRemoveSubtask: (subId) => updateSubtasks(item.id, (subs) => subs.filter((s) => s.id !== subId)),
    };
  }

  function reorder(activeId: string, overId: string) {
    updateItems((list) => {
      const from = list.findIndex((i) => i.id === activeId);
      const to = list.findIndex((i) => i.id === overId);
      return from < 0 || to < 0 ? list : arrayMove(list, from, to);
    });
  }

  // ─── Onglets ──────────────────────────────────────────────────────────────
  function addTab(name: string) {
    const id = newId();
    onChange({ ...value, tabs: [...value.tabs, { id, name, items: [] }], activeTabId: id });
  }

  function renameTab(tabId: string, name: string) {
    onChange({ ...value, tabs: value.tabs.map((t) => (t.id === tabId ? { ...t, name } : t)) });
  }

  function moveTab(tabId: string, dir: -1 | 1) {
    const idx = value.tabs.findIndex((t) => t.id === tabId);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= value.tabs.length) return;
    onChange({ ...value, tabs: arrayMove(value.tabs, idx, target) });
  }

  async function removeTab(tabId: string) {
    const tab = value.tabs.find((t) => t.id === tabId);
    if (!tab || value.tabs.length <= 1) return;
    const count = tab.items.length;
    const message =
      count > 0
        ? `Supprimer l'onglet « ${tab.name} » et ses ${count} tâche${count > 1 ? "s" : ""} ?`
        : `Supprimer l'onglet « ${tab.name} » ?`;
    if (!(await confirmDelete(message))) return;
    const remaining = value.tabs.filter((t) => t.id !== tabId);
    onChange({
      ...value,
      tabs: remaining,
      activeTabId: value.activeTabId === tabId ? remaining[0].id : value.activeTabId,
    });
  }

  const done = items.filter((i) => i.done).length;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <TodoTabsBar
        tabs={value.tabs}
        activeTabId={activeTab?.id ?? ""}
        onSelect={(id) => id !== value.activeTabId && onChange({ ...value, activeTabId: id })}
        onAdd={addTab}
        onRename={renameTab}
        onMove={moveTab}
        onRemove={(id) => void removeTab(id)}
      />
      <TodoAddForm onAdd={(text) => updateItems((list) => [...list, { id: newId(), text, done: false }])} />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <TodoList items={items} actionsFor={actionsFor} onReorder={reorder} />
      </div>
      <TodoFooter done={done} total={items.length} onClearCompleted={() => updateItems((list) => list.filter((i) => !i.done))} />
    </div>
  );
}
