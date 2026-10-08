import { Rocket } from "lucide-react";
import type { GroupDefinition } from "../types";
import { LauncherBody } from "./LauncherBody";
import { defaultState, demoState, type LauncherState } from "./state";

export const launcherGroup: GroupDefinition<LauncherState> = {
  kind: "launcher",
  label: "Lanceur",
  icon: Rocket,
  color: "#0ea5e9",
  defaultState,
  demoState,
  Body: LauncherBody,
  preview: { cols: 1, height: 360 },
};
