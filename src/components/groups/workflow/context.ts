import { createContext, useContext } from "react";
import type { CalendarTarget } from "./calendar";
import type { WorkflowAction, WorkflowState } from "./state";
import type { WorkflowOps } from "./useWorkflowOps";

export type WorkflowContextValue = {
  state: WorkflowState;
  byId: Map<string, WorkflowAction>;
  /** Prérequis non terminés d'une action. */
  blockersOf: (action: WorkflowAction) => WorkflowAction[];
  ops: WorkflowOps;
  /** Calendriers cibles ; vide quand aucun pont n'est branché. */
  calendars: CalendarTarget[];
};

export const WorkflowContext = createContext<WorkflowContextValue | null>(null);

export function useWorkflow(): WorkflowContextValue {
  const ctx = useContext(WorkflowContext);
  if (!ctx) throw new Error("useWorkflow doit être utilisé dans un WorkflowBody");
  return ctx;
}
