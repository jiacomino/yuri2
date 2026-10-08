import { Grid2x2 } from "lucide-react";
import type { GroupDefinition } from "../types";
import { EisenhowerBody } from "./EisenhowerBody";
import { defaultState, demoState, type EisenhowerState } from "./state";

export const eisenhowerGroup: GroupDefinition<EisenhowerState> = {
  kind: "eisenhower",
  label: "Matrice Eisenhower",
  icon: Grid2x2,
  color: "#fb923c",
  defaultState,
  demoState,
  Body: EisenhowerBody,
  preview: { cols: 2, height: 460 },
};
