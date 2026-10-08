import { FileText } from "lucide-react";
import type { GroupDefinition } from "../types";
import { MarkdownBody } from "./MarkdownBody";
import { defaultState, demoState, type MarkdownState } from "./state";

export const markdownGroup: GroupDefinition<MarkdownState> = {
  kind: "markdown",
  label: "Markdown",
  icon: FileText,
  color: "#0ea5a4",
  defaultState,
  demoState,
  Body: MarkdownBody,
  preview: { cols: 2, height: 500 },
};

export type { MarkdownState, MarkdownTab, MarkdownViewMode } from "./state";
