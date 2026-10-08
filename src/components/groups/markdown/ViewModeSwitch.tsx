import { ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { Columns2, Eye, Pencil } from "lucide-react";
import type { MarkdownViewMode } from "./state";

const MODES: { id: MarkdownViewMode; label: string; icon: typeof Pencil }[] = [
  { id: "edit", label: "Édition", icon: Pencil },
  { id: "split", label: "Scindé", icon: Columns2 },
  { id: "preview", label: "Aperçu", icon: Eye },
];

type ViewModeSwitchProps = {
  mode: MarkdownViewMode;
  onChange: (mode: MarkdownViewMode) => void;
};

/** Sélecteur de vue : édition, édition + aperçu côte à côte, aperçu seul. */
export function ViewModeSwitch({ mode, onChange }: ViewModeSwitchProps) {
  return (
    <ToggleButtonGroup
      size="sm"
      isDetached
      className="gap-0.5"
      aria-label="Mode d'affichage"
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[mode]}
      onSelectionChange={(keys) => {
        const next = [...keys][0];
        if (next) onChange(next as MarkdownViewMode);
      }}
    >
      {MODES.map(({ id, label, icon: Icon }) => (
        <ToggleButton
          key={id}
          id={id}
          variant="ghost"
          className={
            "h-7 gap-1.5 rounded-lg px-2.5 text-[0.8889rem] font-semibold text-muted hover:bg-surface hover:text-foreground md:h-7 " +
            "data-[selected=true]:bg-surface data-[selected=true]:text-accent data-[selected=true]:shadow-[0_1px_2px_rgba(16,24,40,.08)]"
          }
        >
          <Icon className="size-3.5" />
          {label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
