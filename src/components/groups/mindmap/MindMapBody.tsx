import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./mindmap.css";
import type { BodyProps } from "../types";
import { MindMapCanvas } from "./MindMapCanvas";
import type { MindMapState } from "./state";

/** Corps du groupe « Carte mentale » : idées reliées sur un canevas React Flow. */
export function MindMapBody(props: BodyProps<MindMapState>) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <ReactFlowProvider>
        <MindMapCanvas {...props} />
      </ReactFlowProvider>
    </div>
  );
}
