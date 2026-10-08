/**
 * Workflow yuri 1 → yuri2. Formats identiques (étapes, actions, applications) :
 * on valide chaque champ et on rétablit les invariants (étape, application et
 * prérequis existants).
 */
import {
  APP_COLORS,
  PRIORITY_ORDER,
  defaultState,
  type ActionStatus,
  type AppTag,
  type ChecklistItem,
  type WorkflowAction,
  type WorkflowState,
  type WorkflowStep,
} from "@/components/groups/workflow/state";
import type { Converter } from "../types";
import { arr, isObj, obj, oneOf, optStr, str } from "./util";

const STATUSES: readonly ActionStatus[] = ["todo", "doing", "done"];

const strings = (v: unknown) => arr(v).filter((s): s is string => typeof s === "string");

function uniqueById<T extends { id: string }>(list: T[]): T[] {
  const seen = new Set<string>();
  return list.filter((x) => !seen.has(x.id) && !!seen.add(x.id));
}

/** Objets portant un `id` et un champ texte `key`. */
function records(v: unknown, key: string): Record<string, unknown>[] {
  return arr(v).filter((x): x is Record<string, unknown> => isObj(x) && typeof x.id === "string" && typeof x[key] === "string");
}

function checklist(v: unknown): ChecklistItem[] {
  return records(v, "label").map((c) => ({ id: c.id as string, label: c.label as string, done: !!c.done }));
}

export const convertWorkflow: Converter<WorkflowState> = (raw) => {
  const r = obj(raw);

  const steps: WorkflowStep[] = uniqueById(
    records(r.steps, "name").map((s) => {
      const color = optStr(s.color);
      return { id: s.id as string, name: s.name as string, exitCriteria: strings(s.exitCriteria), ...(color ? { color } : {}) };
    }),
  );
  if (steps.length === 0) return defaultState();
  const stepIds = new Set(steps.map((s) => s.id));

  const apps: AppTag[] = uniqueById(
    records(r.apps, "name").map((a, i) => ({
      id: a.id as string,
      name: a.name as string,
      color: optStr(a.color) ?? APP_COLORS[i % APP_COLORS.length],
    })),
  );
  const appIds = new Set(apps.map((a) => a.id));

  const now = new Date().toISOString();
  const actions: WorkflowAction[] = uniqueById(
    records(r.actions, "title").map((a) => {
      const action: WorkflowAction = {
        id: a.id as string,
        title: a.title as string,
        notes: str(a.notes),
        stepId: typeof a.stepId === "string" && stepIds.has(a.stepId) ? a.stepId : steps[0].id,
        status: oneOf(a.status, STATUSES, "todo"),
        priority: oneOf(a.priority, PRIORITY_ORDER, "normal"),
        owner: str(a.owner),
        due: str(a.due),
        dependsOn: strings(a.dependsOn),
        checklist: checklist(a.checklist),
        enteredAt: optStr(a.enteredAt) ?? now,
      };
      if (typeof a.appId === "string" && appIds.has(a.appId)) action.appId = a.appId;
      const alarmAt = optStr(a.alarmAt);
      if (alarmAt) {
        action.alarmAt = alarmAt;
        if (typeof a.alarmFired === "boolean") action.alarmFired = a.alarmFired;
      }
      return action;
    }),
  );

  const actionIds = new Set(actions.map((a) => a.id));
  for (const a of actions) {
    a.dependsOn = [...new Set(a.dependsOn)].filter((d) => d !== a.id && actionIds.has(d));
  }

  return { steps, actions, apps };
};
