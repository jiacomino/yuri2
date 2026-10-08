import { Target } from "lucide-react";
import type { GroupDefinition } from "../types";
import { GoalsBody } from "./GoalsBody";
import { defaultState, demoState, type GoalsState } from "./state";

export const goalsGroup: GroupDefinition<GoalsState> = {
  kind: "goals",
  label: "Objectifs",
  icon: Target,
  color: "#f97316",
  defaultState,
  demoState,
  Body: GoalsBody,
  preview: { cols: 1, height: 460 },
};
