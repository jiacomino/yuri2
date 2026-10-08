import { StickyNote } from "lucide-react";
import type { GroupDefinition } from "../types";
import { PostItBody } from "./PostItBody";
import { defaultState, demoState, type PostItState } from "./state";

export const postitGroup: GroupDefinition<PostItState> = {
  kind: "postit",
  label: "Post-it",
  icon: StickyNote,
  color: "#f59e0b",
  defaultState,
  demoState,
  Body: PostItBody,
  preview: { cols: 1, height: 300 },
};

export type { PostItState } from "./state";
