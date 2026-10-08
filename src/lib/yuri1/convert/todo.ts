/**
 * Todo yuri 1 → yuri2. Format quasi identique (onglets, sous-tâches, priorités, alarmes) ;
 * tolère l'ancien format v1 `{ items: [...] }` sans onglets. La priorité « none » est retirée.
 */
import {
  defaultTodoState,
  newId,
  type TodoItem,
  type TodoPriority,
  type TodoState,
  type TodoSubtask,
  type TodoTab,
} from "@/components/groups/todo/state";
import type { Converter } from "../types";
import { arr, bool, isObj, obj, optStr, str } from "./util";

const PRIORITY_MAP: Record<string, TodoPriority> = {
  urgent: "urgent",
  high: "high",
  important: "high",
  normal: "normal",
  medium: "normal",
  low: "low",
};

function subtasks(v: unknown): TodoSubtask[] {
  return arr(v)
    .filter(isObj)
    .filter((s) => typeof s.text === "string")
    .map((s) => ({ id: optStr(s.id) ?? newId(), text: str(s.text), done: bool(s.done) }));
}

function items(v: unknown): TodoItem[] {
  return arr(v)
    .filter(isObj)
    .filter((i) => typeof i.text === "string")
    .map((i) => {
      const item: TodoItem = { id: optStr(i.id) ?? newId(), text: str(i.text), done: bool(i.done) };
      const priority = PRIORITY_MAP[str(i.priority)];
      if (priority) item.priority = priority;
      const subs = subtasks(i.subtasks);
      if (subs.length > 0) item.subtasks = subs;
      const alarmAt = optStr(i.alarmAt);
      if (alarmAt && !Number.isNaN(new Date(alarmAt).getTime())) {
        item.alarmAt = alarmAt;
        if (typeof i.alarmFired === "boolean") item.alarmFired = i.alarmFired;
      }
      return item;
    });
}

export const convertTodo: Converter<TodoState> = (raw) => {
  const r = obj(raw);
  const tabs: TodoTab[] = arr(r.tabs)
    .filter(isObj)
    .map((t) => ({ id: optStr(t.id) ?? newId(), name: str(t.name, "Tâches") || "Tâches", items: items(t.items) }));
  if (tabs.length === 0) {
    // Ancien format v1 : liste plate, ou rien d'exploitable.
    if (!Array.isArray(r.items)) return defaultTodoState();
    tabs.push({ id: newId(), name: "Tâches", items: items(r.items) });
  }
  const active = str(r.activeTabId);
  return { tabs, activeTabId: tabs.some((t) => t.id === active) ? active : tabs[0].id };
};
