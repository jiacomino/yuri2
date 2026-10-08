import {
  ArrowUpRight,
  Check,
  Circle,
  Highlighter,
  MessageSquare,
  Minus,
  PenLine,
  Square,
  SquareDashed,
  Type,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  CalloutMarkerEditor,
  ShapeMarkerEditor,
  TextMarkerEditor,
  type MarkerBaseEditor,
} from "@markerjs/markerjs3";

export type MarkerTool = { type: string; label: string; icon: LucideIcon };

/** Outils proposés (noms de type marker.js 3). */
export const MARKER_TOOLS: MarkerTool[] = [
  { type: "ArrowMarker", label: "Flèche", icon: ArrowUpRight },
  { type: "FrameMarker", label: "Cadre", icon: Square },
  { type: "EllipseFrameMarker", label: "Ellipse", icon: Circle },
  { type: "LineMarker", label: "Ligne", icon: Minus },
  { type: "FreehandMarker", label: "Main levée", icon: PenLine },
  { type: "TextMarker", label: "Texte", icon: Type },
  { type: "CalloutMarker", label: "Légende", icon: MessageSquare },
  { type: "HighlightMarker", label: "Surligner", icon: Highlighter },
  { type: "CoverMarker", label: "Masquer", icon: SquareDashed },
  { type: "CheckImageMarker", label: "Coche", icon: Check },
  { type: "XImageMarker", label: "Croix", icon: X },
];

export const MARKER_COLORS = ["#ef4444", "#f97316", "#facc15", "#22c55e", "#3b82f6", "#a855f7", "#111827", "#ffffff"];

export const STROKE_WIDTHS = [2, 3, 5, 8];

export type MarkerStyle = { color: string; width: number };

export const DEFAULT_MARKER_STYLE: MarkerStyle = { color: MARKER_COLORS[0], width: 3 };

const LIGHT_COLORS = new Set(["#facc15", "#ffffff"]);

/** Applique couleur et épaisseur à un marqueur selon sa nature (texte, forme pleine, trait). */
export function applyMarkerStyle(editor: MarkerBaseEditor, style: Partial<MarkerStyle>) {
  const { color, width } = style;
  if (editor.is(CalloutMarkerEditor)) {
    if (color) {
      editor.fillColor = color;
      editor.color = LIGHT_COLORS.has(color) ? "#111827" : "#ffffff";
    }
    return;
  }
  if (editor.is(TextMarkerEditor)) {
    if (color) editor.color = color;
    return;
  }
  if (editor.is(ShapeMarkerEditor)) {
    if (color) editor.fillColor = color;
    return;
  }
  if (color) editor.strokeColor = color;
  if (width) editor.strokeWidth = width;
}
