import { Type } from "lucide-react";
import type { GroupDefinition } from "../types";
import { TextBody } from "./TextBody";
import { defaultState, demoState, type TextState } from "./state";

export const textGroup: GroupDefinition<TextState> = {
  kind: "text",
  label: "Texte",
  icon: Type,
  color: "#8b5cf6",
  defaultState,
  demoState,
  Body: TextBody,
  preview: { cols: 2, height: 460 },
};

export type { TextState, TextTab } from "./state";
