import { ArrowDownUp } from "lucide-react";
import type { GroupDefinition } from "../types";
import { ImportExportBody } from "./ImportExportBody";
import { defaultState, demoState, type ImportExportState } from "./state";

export const importExportGroup: GroupDefinition<ImportExportState> = {
  kind: "importexport",
  label: "Import / Export",
  icon: ArrowDownUp,
  color: "#7c3aed",
  defaultState,
  demoState,
  Body: ImportExportBody,
  preview: { cols: 1, height: 360 },
};
