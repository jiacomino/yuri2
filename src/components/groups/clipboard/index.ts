import { ClipboardList } from "lucide-react";
import type { GroupDefinition } from "../types";
import { ClipboardBody } from "./ClipboardBody";
import { defaultState, demoState, type ClipboardState } from "./state";

export const clipboardGroup: GroupDefinition<ClipboardState> = {
  kind: "clipboard",
  label: "Presse-papiers",
  icon: ClipboardList,
  color: "#8b5cf6",
  defaultState,
  demoState,
  Body: ClipboardBody,
  preview: { cols: 1, height: 420 },
};
