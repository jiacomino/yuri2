import { Link2 } from "lucide-react";
import type { GroupDefinition } from "../types";
import { LinksBody } from "./LinksBody";
import { defaultState, demoState, type LinksState } from "./state";

export const linksGroup: GroupDefinition<LinksState> = {
  kind: "links",
  label: "Liens",
  icon: Link2,
  color: "#4f7cff",
  defaultState,
  demoState,
  Body: LinksBody,
  preview: { cols: 1, height: 460 },
};

export type { LinksState, LinkItem, LinkTab } from "./state";
