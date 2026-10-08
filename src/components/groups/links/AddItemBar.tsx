import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { InlineInput } from "@/components/shared/InlineInput";

type AddItemBarProps = {
  onAddLink: () => void;
  onAddSeparator: (label: string) => void;
};

const dashed =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-border bg-transparent font-semibold text-muted transition-colors hover:border-accent/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none";

/** Boutons d'ajout en pied de liste : lien (fenêtre) ou séparateur (saisie sur place). */
export function AddItemBar({ onAddLink, onAddSeparator }: AddItemBarProps) {
  const [addingSeparator, setAddingSeparator] = useState(false);

  if (addingSeparator) {
    return (
      <InlineInput
        ariaLabel="Libellé du séparateur"
        placeholder="Libellé du séparateur"
        onCommit={(label) => {
          onAddSeparator(label);
          setAddingSeparator(false);
        }}
        onCancel={() => setAddingSeparator(false)}
        className="h-9 w-full text-xs"
      />
    );
  }

  return (
    <div className="flex shrink-0 gap-2">
      <button type="button" onClick={onAddLink} className={`${dashed} flex-1`}>
        <Plus className="size-3.5" />
        Ajouter un lien
      </button>
      <button type="button" onClick={() => setAddingSeparator(true)} className={`${dashed} px-3`}>
        <Minus className="size-3.5" />
        Séparateur
      </button>
    </div>
  );
}
