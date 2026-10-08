import type { ReactNode } from "react";
import { Button, Popover, Separator, Tooltip } from "@heroui/react";
import { Maximize2, Palette, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NODE_COLORS } from "./state";

type MindMapToolbarProps = {
  selectedCount: number;
  onAdd: () => void;
  onRecolor: (color: string) => void;
  onRemoveSelection: () => void;
  onFit: () => void;
};

/**
 * Barre d'outils flottante (pilule en haut à gauche du canevas) : ajout d'idée, couleur et
 * suppression de la sélection, recadrage. L'aide s'affiche en bas tant que rien n'est sélectionné.
 */
export function MindMapToolbar({ selectedCount, onAdd, onRecolor, onRemoveSelection, onFit }: MindMapToolbarProps) {
  return (
    <>
      <div className="absolute top-2 left-2 z-10 flex items-center gap-0.5 rounded-full border border-separator bg-surface p-1 shadow-[0_1px_2px_rgba(16,24,40,.06),0_4px_14px_rgba(16,24,40,.08)]">
        <ToolButton label="Ajouter une idée" onPress={onAdd}>
          <Plus className="size-4" />
        </ToolButton>

        {selectedCount > 0 && (
          <>
            <Separator orientation="vertical" className="mx-0.5 h-4" />
            <ColorPicker onPick={onRecolor} />
            <ToolButton label={`Supprimer (${selectedCount})`} onPress={onRemoveSelection} className="text-danger">
              <Trash2 className="size-3.5" />
            </ToolButton>
            <span className="pr-1.5 text-[0.8148rem] font-bold tabular-nums text-muted">{selectedCount}</span>
          </>
        )}

        <Separator orientation="vertical" className="mx-0.5 h-4" />
        <ToolButton label="Recadrer la carte" onPress={onFit}>
          <Maximize2 className="size-3.5" />
        </ToolButton>
      </div>

      {selectedCount === 0 && (
        <span className="pointer-events-none absolute right-3 bottom-2 left-28 z-10 truncate text-right text-[0.8148rem] text-muted">
          Double-clic sur le fond pour ajouter · sur une idée pour la renommer · tirez un point pour relier
        </span>
      )}
    </>
  );
}

type ToolButtonProps = {
  label: string;
  className?: string;
  onPress: () => void;
  children: ReactNode;
};

function ToolButton({ label, className, onPress, children }: ToolButtonProps) {
  return (
    <Tooltip delay={400}>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label={label}
        className={cn("size-7 min-w-7 rounded-full", className)}
        onPress={onPress}
      >
        {children}
      </Button>
      <Tooltip.Content>{label}</Tooltip.Content>
    </Tooltip>
  );
}

function ColorPicker({ onPick }: { onPick: (color: string) => void }) {
  return (
    <Popover>
      <Button isIconOnly size="sm" variant="ghost" aria-label="Couleur de la sélection" className="size-7 min-w-7 rounded-full">
        <Palette className="size-3.5" />
      </Button>
      <Popover.Content placement="bottom start">
        <Popover.Dialog className="grid grid-cols-4 gap-2 p-2.5" aria-label="Couleur de la sélection">
          {NODE_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onPick(color)}
              aria-label={`Colorer en ${color}`}
              title={color}
              className="size-6 cursor-pointer rounded-full shadow-[inset_0_0_0_1px_rgba(16,24,40,.12)] transition-transform hover:scale-110"
              style={{ backgroundColor: color }}
            />
          ))}
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
