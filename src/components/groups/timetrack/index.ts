import { Timer } from "lucide-react";
import type { GroupDefinition } from "../types";
import { TimeTrackBody } from "./TimeTrackBody";
import { defaultState, demoState, type TimeTrackState } from "./state";

export const timetrackGroup: GroupDefinition<TimeTrackState> = {
  kind: "timetrack",
  label: "Suivi du temps",
  icon: Timer,
  color: "#0ea5e9",
  defaultState,
  demoState,
  Body: TimeTrackBody,
  preview: { cols: 1, height: 560 },
};
