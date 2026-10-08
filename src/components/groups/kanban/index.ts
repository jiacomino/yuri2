import { SquareKanban } from "lucide-react";
import type { GroupDefinition } from "../types";
import { defaultKanbanState, demoKanbanState, type KanbanState } from "./state";
import { KanbanBody } from "./KanbanBody";

export const kanbanGroup: GroupDefinition<KanbanState> = {
  kind: "kanban",
  label: "Kanban",
  icon: SquareKanban,
  color: "#6366f1",
  defaultState: defaultKanbanState,
  demoState: demoKanbanState,
  Body: KanbanBody,
  preview: { cols: 3, height: 460 },
};

export type { KanbanState } from "./state";
