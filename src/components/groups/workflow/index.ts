import { Workflow } from "lucide-react";
import type { GroupDefinition } from "../types";
import { defaultState, demoState, type WorkflowState } from "./state";
import { WorkflowBody } from "./WorkflowBody";

export type { WorkflowState } from "./state";

export const workflowGroup: GroupDefinition<WorkflowState> = {
  kind: "workflow",
  label: "Suivi projet",
  icon: Workflow,
  color: "#8b5cf6",
  defaultState,
  demoState,
  Body: WorkflowBody,
  preview: { cols: 2, height: 640 },
};
