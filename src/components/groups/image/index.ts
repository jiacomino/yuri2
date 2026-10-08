import { ImagePlus } from "lucide-react";
import type { GroupDefinition } from "../types";
import { ImageBody } from "./ImageBody";
import { defaultState, demoState, type ImageState } from "./state";

export const imageGroup: GroupDefinition<ImageState> = {
  kind: "image",
  label: "Image annotée",
  icon: ImagePlus,
  color: "#f97316",
  defaultState,
  demoState,
  Body: ImageBody,
  preview: { cols: 1, height: 340 },
};
