import { Rocket } from "lucide-react";
import type { GroupDefinition } from "../types";
import { DeployBody } from "./DeployBody";
import { defaultState, demoState, type DeployState } from "./state";

export const deployGroup: GroupDefinition<DeployState> = {
  kind: "deploy",
  label: "Mise en production",
  icon: Rocket,
  color: "#0891b2",
  defaultState,
  demoState,
  Body: DeployBody,
  preview: { cols: 1, height: 520 },
};
