import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Button, Popover } from "@heroui/react";
import { cn } from "@/lib/utils";

type ColorPickerProps = {
  icon: LucideIcon;
  label: string;
  presets: string[];
  /** Couleur appliquée à la sélection courante (pastille sous l'icône). */
  current?: string | null;
  onPick: (color: string) => void;
  onClear: () => void;
  clearLabel: string;
};

/** Bouton + popover de choix de couleur : pastilles, couleur personnalisée, retrait. */
export function ColorPicker({ icon: Icon, label, presets, current, onPick, onClear, clearLabel }: ColorPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover isOpen={open} onOpenChange={setOpen}>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label={label}
        className="size-7 min-w-7 rounded-lg text-muted hover:bg-surface hover:text-foreground"
      >
        <span title={label} className="flex flex-col items-center gap-px">
          <Icon className="size-3.5" />
          <span
            className="h-[3px] w-3.5 rounded-full"
            style={{ background: current ?? "transparent" }}
          />
        </span>
      </Button>
      <Popover.Content placement="bottom start">
        <Popover.Dialog aria-label={label} className="flex flex-col gap-2.5 p-3">
          <span className="text-[0.8148rem] font-bold tracking-[.06em] text-muted uppercase">{label}</span>
          <div className="grid grid-cols-5 gap-1.5">
            {presets.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                onClick={() => {
                  onPick(c);
                  setOpen(false);
                }}
                style={{ backgroundColor: c }}
                className={cn(
                  "size-6 cursor-pointer rounded-lg ring-1 ring-black/10 transition-transform outline-none hover:scale-110 focus-visible:ring-2 focus-visible:ring-accent dark:ring-white/15",
                  current?.toLowerCase() === c && "ring-2 ring-accent dark:ring-accent",
                )}
              />
            ))}
          </div>
          <label className="flex items-center gap-2 text-[0.8889rem] font-semibold text-muted">
            Personnalisée
            <input
              type="color"
              defaultValue={current ?? presets[0]}
              onChange={(e) => onPick(e.currentTarget.value)}
              className="h-6 w-8 cursor-pointer rounded-md border border-border bg-transparent"
            />
          </label>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => {
              onClear();
              setOpen(false);
            }}
            className="justify-start font-semibold text-muted hover:text-foreground"
          >
            {clearLabel}
          </Button>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
