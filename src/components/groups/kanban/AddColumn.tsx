import { useState } from "react";
import { Button, Input } from "@heroui/react";
import { Plus } from "lucide-react";

type AddColumnProps = {
  onAdd: (name: string) => void;
};

/** Tuile « Ajouter une colonne » en fin de tableau, qui se transforme en formulaire. */
export function AddColumn({ onAdd }: AddColumnProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  function close() {
    setName("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-56 shrink-0 items-center justify-center gap-1.5 self-start rounded-[10px] border border-dashed border-border text-[0.8889rem] font-semibold text-muted transition-colors hover:border-accent/50 hover:text-foreground"
      >
        <Plus className="size-3.5" />
        Ajouter une colonne
      </button>
    );
  }

  return (
    <form
      className="flex w-56 shrink-0 flex-col gap-2 self-start rounded-xl bg-surface-secondary p-2.5"
      onSubmit={(e) => {
        e.preventDefault();
        const clean = name.trim();
        if (clean) onAdd(clean);
        close();
      }}
    >
      <Input
        autoFocus
        aria-label="Nom de la colonne"
        placeholder="Nom de la colonne"
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
        onBlur={(e) => {
          const next = e.relatedTarget as Node | null;
          if (!name.trim() && !(next && e.currentTarget.form?.contains(next))) close();
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            close();
          }
        }}
        className="h-7 rounded-lg px-2 py-0 text-[0.9259rem]"
      />
      <div className="flex items-center justify-end gap-1">
        <Button size="sm" variant="ghost" onPress={close} className="h-7 px-2.5 text-xs">
          Annuler
        </Button>
        <Button type="submit" size="sm" variant="primary" className="h-7 px-2.5 text-xs">
          Ajouter
        </Button>
      </div>
    </form>
  );
}
