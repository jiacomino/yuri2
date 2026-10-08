import { PersonStanding } from "lucide-react";
import type { GroupDefinition } from "../types";
import { PostureBody } from "./PostureBody";
import { defaultPostureState, demoPostureState, type PostureState } from "./state";

export const postureGroup: GroupDefinition<PostureState> = {
  kind: "posture",
  label: "Posture",
  icon: PersonStanding,
  color: "#10b981",
  defaultState: defaultPostureState,
  demoState: demoPostureState,
  Body: PostureBody,
  preview: { cols: 1, height: 520 },
};

export type { PostureState } from "./state";
