import { useMemo, useRef } from "react";
import type { ConfirmRequest } from "./ConfirmModal";
import { buildCalendarTask, type SendToCalendar } from "./calendar";
import * as S from "./state";
import type { AppTag, WorkflowAction, WorkflowState } from "./state";

export type WorkflowOps = {
  addAction: (stepId: string, title: string, appId?: string) => void;
  patch: (id: string, patch: Partial<WorkflowAction>) => void;
  advance: (action: WorkflowAction) => Promise<void>;
  reopen: (action: WorkflowAction) => void;
  cycleStatus: (action: WorkflowAction) => void;
  remove: (id: string) => Promise<boolean>;
  moveToStep: (id: string, stepId: string) => void;
  drop: (draggedId: string, overId: string) => void;
  toggleDependency: (id: string, depId: string) => void;
  toggleChecklist: (id: string, itemId: string) => void;
  addChecklistItem: (id: string, label: string) => void;
  removeChecklistItem: (id: string, itemId: string) => void;
  setAlarm: (id: string, alarmAt: string | undefined) => void;
  markAlarmsFired: (ids: Set<string>) => void;
  setApp: (id: string, appId: string | undefined) => void;
  /** Crée une application et renvoie son id, pour pouvoir la sélectionner aussitôt. */
  createApp: (name: string, color: string) => string | undefined;
  updateApp: (appId: string, patch: Partial<Omit<AppTag, "id">>) => void;
  removeApp: (appId: string) => Promise<boolean>;
  addStep: (name: string) => void;
  renameStep: (id: string, name: string) => void;
  setStepColor: (id: string, color: string) => void;
  setStepCriteria: (id: string, criteria: string[]) => void;
  moveStep: (id: string, dir: -1 | 1) => void;
  removeStep: (id: string) => Promise<boolean>;
  /** Absent quand aucun calendrier n'est branché. */
  scheduleInCalendar?: (
    action: WorkflowAction,
    calendarId: string,
    start: string,
    durationMin: number,
    allDay: boolean,
  ) => void;
};

type Confirm = (req: ConfirmRequest) => Promise<boolean>;

/**
 * Toutes les opérations sur l'état contrôlé. Un ref garde la dernière valeur :
 * deux mises à jour enchaînées dans le même tick (créer une application puis la
 * sélectionner) ou après une confirmation asynchrone partent du bon état.
 */
export function useWorkflowOps(
  value: WorkflowState,
  onChange: (next: WorkflowState) => void,
  confirm: Confirm,
  onSendToCalendar?: SendToCalendar,
): WorkflowOps {
  const latest = useRef(value);
  latest.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const sendRef = useRef(onSendToCalendar);
  sendRef.current = onSendToCalendar;
  const hasCalendar = !!onSendToCalendar;

  return useMemo<WorkflowOps>(() => {
    const get = () => latest.current;
    const update = (fn: (s: WorkflowState) => WorkflowState) => {
      const next = fn(latest.current);
      if (next === latest.current) return;
      latest.current = next;
      onChangeRef.current(next);
    };
    const find = (id: string) => get().actions.find((a) => a.id === id);

    return {
      addAction: (stepId, title, appId) => update((s) => S.addAction(s, stepId, title, appId)),
      patch: (id, patch) => update((s) => S.patchAction(s, id, patch)),
      advance: async (action) => {
        const next = S.nextStepOf(get(), action);
        if (!next) return;
        const pending = (find(action.id) ?? action).checklist.filter((c) => !c.done).length;
        if (pending > 0) {
          const ok = await confirm({
            title: "Étape suivante",
            message: `${pending} critère${pending > 1 ? "s" : ""} de sortie non coché${pending > 1 ? "s" : ""}. Passer quand même à « ${next.name} » ?`,
            confirmLabel: "Passer",
          });
          if (!ok) return;
        }
        update((s) => S.moveActionToStep(s, action.id, next.id));
      },
      reopen: (action) => update((s) => S.reopenAction(s, find(action.id) ?? action)),
      cycleStatus: (action) => update((s) => S.cycleStatus(s, find(action.id) ?? action)),
      remove: async (id) => {
        const ok = await confirm({
          title: "Supprimer l'action",
          message: `Supprimer l'action « ${find(id)?.title ?? ""} » ?`,
          confirmLabel: "Supprimer",
          danger: true,
        });
        if (ok) update((s) => S.removeAction(s, id));
        return ok;
      },
      moveToStep: (id, stepId) => update((s) => S.moveActionToStep(s, id, stepId)),
      drop: (draggedId, overId) => update((s) => S.dropAction(s, draggedId, overId)),
      toggleDependency: (id, depId) => update((s) => S.toggleDependency(s, id, depId)),
      toggleChecklist: (id, itemId) => update((s) => S.toggleChecklistItem(s, id, itemId)),
      addChecklistItem: (id, label) => update((s) => S.addChecklistItem(s, id, label)),
      removeChecklistItem: (id, itemId) => update((s) => S.removeChecklistItem(s, id, itemId)),
      setAlarm: (id, alarmAt) => update((s) => S.setActionAlarm(s, id, alarmAt)),
      markAlarmsFired: (ids) => update((s) => S.markAlarmsFired(s, ids)),
      setApp: (id, appId) => update((s) => S.patchAction(s, id, { appId })),
      createApp: (name, color) => {
        let created: string | undefined;
        update((s) => {
          const res = S.addApp(s, name, color);
          created = res.id;
          return res.state;
        });
        return created;
      },
      updateApp: (appId, patch) => update((s) => S.updateApp(s, appId, patch)),
      removeApp: async (appId) => {
        const app = get().apps.find((a) => a.id === appId);
        if (!app) return false;
        const used = get().actions.filter((a) => a.appId === appId).length;
        if (used > 0) {
          const ok = await confirm({
            title: "Supprimer l'application",
            message: `Supprimer l'application « ${app.name} » ? ${used} action${
              used > 1 ? "s seront désaffectées" : " sera désaffectée"
            }.`,
            confirmLabel: "Supprimer",
            danger: true,
          });
          if (!ok) return false;
        }
        update((s) => S.removeApp(s, appId));
        return true;
      },
      addStep: (name) => update((s) => S.addStep(s, name)),
      renameStep: (id, name) => update((s) => S.renameStep(s, id, name)),
      setStepColor: (id, color) => update((s) => S.setStepColor(s, id, color)),
      setStepCriteria: (id, criteria) => update((s) => S.setStepCriteria(s, id, criteria)),
      moveStep: (id, dir) => update((s) => S.moveStep(s, id, dir)),
      removeStep: async (id) => {
        const state = get();
        const step = state.steps.find((s) => s.id === id);
        const fallback = S.fallbackStepFor(state, id);
        if (!step || !fallback || state.steps.length <= 1) return false;
        const orphans = state.actions.filter((a) => a.stepId === id).length;
        const ok = await confirm({
          title: "Supprimer l'étape",
          message:
            orphans > 0
              ? `Supprimer l'étape « ${step.name} » ? ${orphans} action${orphans > 1 ? "s seront déplacées" : " sera déplacée"} vers « ${fallback.name} ».`
              : `Supprimer l'étape « ${step.name} » ?`,
          confirmLabel: "Supprimer",
          danger: true,
        });
        if (ok) update((s) => S.removeStep(s, id));
        return ok;
      },
      scheduleInCalendar: hasCalendar
        ? (action, calendarId, start, durationMin, allDay) => {
            const task = buildCalendarTask(action, get().apps, start, durationMin, allDay);
            if (task) sendRef.current?.(calendarId, task);
          }
        : undefined,
    };
  }, [confirm, hasCalendar]);
}
