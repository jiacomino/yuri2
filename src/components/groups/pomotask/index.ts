import { Hourglass } from "lucide-react";
import type { GroupDefinition } from "../types";
import { PomoTaskBody } from "./PomoTaskBody";
import { defaultState, demoState, type PomoTaskState } from "./state";

export const pomotaskGroup: GroupDefinition<PomoTaskState> = {
  kind: "pomotask",
  label: "Pomodoro & tâches",
  icon: Hourglass,
  color: "#ec4899",
  defaultState,
  demoState,
  Body: PomoTaskBody,
  preview: { cols: 1, height: 560 },
};
