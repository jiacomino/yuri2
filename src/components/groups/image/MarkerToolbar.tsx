import { Button, Separator, Tooltip } from "@heroui/react";
import { MousePointer2, Redo2, Trash2, Undo2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MARKER_COLORS, MARKER_TOOLS, STROKE_WIDTHS } from "./markerTools";
import type { MarkerAreaControls } from "./useMarkerArea";

type MarkerToolbarProps = { controls: MarkerAreaControls };

/** Barre d'outils de l'éditeur : outils, couleur, épaisseur, annuler / rétablir. */
export function MarkerToolbar({ controls }: MarkerToolbarProps) {
  const { activeTool, style } = controls;

  return (
    <div className="mx-auto flex max-w-full flex-wrap items-center gap-0.5 rounded-full border border-separator bg-surface p-1 shadow-[0_1px_2px_rgba(16,24,40,.06),0_6px_20px_rgba(16,24,40,.08)]">
      <ToolButton label="Sélection" active={activeTool === null} onPress={controls.selectMode}>
        <MousePointer2 className="size-4" />
      </ToolButton>
      {MARKER_TOOLS.map((tool) => (
        <ToolButton
          key={tool.type}
          label={tool.label}
          active={activeTool === tool.type}
          onPress={() => controls.createMarker(tool.type)}
        >
          <tool.icon className="size-4" />
        </ToolButton>
      ))}

      <Separator orientation="vertical" className="mx-1.5 h-5" />

      <div className="flex items-center gap-1" role="group" aria-label="Couleur">
        {MARKER_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Couleur ${color}`}
            aria-pressed={style.color === color}
            onClick={() => controls.setStyle({ color })}
            className={cn(
              "size-5 cursor-pointer rounded-full shadow-[inset_0_0_0_1px_rgba(16,24,40,.12)] transition-transform hover:scale-110",
              style.color === color && "ring-2 ring-accent ring-offset-2 ring-offset-surface",
            )}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      <Separator orientation="vertical" className="mx-1.5 h-5" />

      <div className="flex items-center gap-0.5" role="group" aria-label="Épaisseur du trait">
        {STROKE_WIDTHS.map((width) => (
          <button
            key={width}
            type="button"
            title={`Épaisseur ${width}`}
            aria-label={`Épaisseur ${width}`}
            aria-pressed={style.width === width}
            onClick={() => controls.setStyle({ width })}
            className={cn(
              "grid size-7 cursor-pointer place-items-center rounded-full text-muted hover:bg-default hover:text-foreground",
              style.width === width && "bg-accent/12 text-accent",
            )}
          >
            <span className="block w-4 rounded-full bg-current" style={{ height: Math.min(width, 6) }} />
          </button>
        ))}
      </div>

      <Separator orientation="vertical" className="mx-1.5 h-5" />

      <ToolButton label="Annuler" onPress={controls.undo} isDisabled={!controls.canUndo}>
        <Undo2 className="size-4" />
      </ToolButton>
      <ToolButton label="Rétablir" onPress={controls.redo} isDisabled={!controls.canRedo}>
        <Redo2 className="size-4" />
      </ToolButton>
      <ToolButton
        label="Supprimer la sélection"
        onPress={controls.deleteSelected}
        isDisabled={controls.selectedCount === 0}
        className="text-danger"
      >
        <Trash2 className="size-4" />
      </ToolButton>
    </div>
  );
}

type ToolButtonProps = {
  label: string;
  active?: boolean;
  isDisabled?: boolean;
  className?: string;
  onPress: () => void;
  children: ReactNode;
};

function ToolButton({ label, active, isDisabled, className, onPress, children }: ToolButtonProps) {
  return (
    <Tooltip delay={400}>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label={label}
        aria-pressed={active}
        isDisabled={isDisabled}
        onPress={onPress}
        className={cn("rounded-full", active && "bg-accent/12 text-accent hover:bg-accent/16", className)}
      >
        {children}
      </Button>
      <Tooltip.Content>{label}</Tooltip.Content>
    </Tooltip>
  );
}
