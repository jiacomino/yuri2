import { Timer } from "lucide-react";
import type { GroupDefinition } from "../types";
import { PomodoroBody } from "./PomodoroBody";
import { defaultState, demoState, type PomodoroState } from "./state";

export const pomodoroGroup: GroupDefinition<PomodoroState> = {
  kind: "pomodoro",
  label: "Pomodoro",
  icon: Timer,
  color: "#ef4444",
  defaultState,
  demoState,
  Body: PomodoroBody,
  preview: { cols: 1, height: 360 },
};
