import { Network } from "lucide-react";
import type { GroupDefinition } from "../types";
import { MindMapBody } from "./MindMapBody";
import { defaultState, demoState, type MindMapState } from "./state";

export const mindmapGroup: GroupDefinition<MindMapState> = {
  kind: "mindmap",
  label: "Carte mentale",
  icon: Network,
  color: "#8b5cf6",
  defaultState,
  demoState,
  Body: MindMapBody,
  preview: { cols: 2, height: 420 },
};
