import { useState } from "react";
import { Button, Input } from "@heroui/react";
import { Check, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppChip } from "./AppChip";
import { ColorInput } from "./ColorInput";
import { nextColor } from "./meta";
import type { AppTag } from "./state";

type AppPickerProps = {
  apps: AppTag[];
  value: string | undefined;
  onChange: (appId: string | undefined) => void;
  /** Crée une application et renvoie son id pour la sélectionner aussitôt. */
  onCreate: (name: string, color: string) => string | undefined;
};

/** Choix de l'application d'une tâche, avec création à la volée. */
export function AppPicker({ apps, value, onChange, onCreate }: AppPickerProps) {
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftColor, setDraftColor] = useState(() => nextColor(apps.length));

  function reset() {
    setDraft("");
    setCreating(false);
  }

  function commit() {
    const name = draft.trim();
    if (!name) return reset();
    const id = onCreate(name, draftColor);
    if (id) onChange(id);
    setDraftColor(nextColor(apps.length + 1));
    reset();
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        aria-pressed={!value}
        onClick={() => onChange(undefined)}
        className={cn(
          "rounded-full bg-surface-secondary px-2.5 py-0.5 text-xs text-muted transition-all",
          !value ? "ring-2 ring-border" : "opacity-70 hover:opacity-100",
        )}
      >
        Aucune
      </button>
      {apps.map((app) => (
        <AppChip key={app.id} app={app} active={value === app.id} onPress={() => onChange(app.id)} />
      ))}

      {creating ? (
        <span className="inline-flex items-center gap-1">
          {/* Pas de validation au blur : la boîte de couleur native ferait perdre le focus. */}
          <ColorInput value={draftColor} onChange={setDraftColor} label="Couleur de la nouvelle application" />
          <Input
            autoFocus
            aria-label="Nom de l'application"
            value={draft}
            onChange={(e) => setDraft(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
              } else if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                reset();
              }
            }}
            placeholder="Nom de l'application"
            className="h-7 w-36 text-xs"
          />
          <Button isIconOnly size="sm" variant="ghost" aria-label="Créer l'application" isDisabled={!draft.trim()} onPress={commit}>
            <Check className="size-3.5" />
          </Button>
          <Button isIconOnly size="sm" variant="ghost" aria-label="Annuler" onPress={reset}>
            <X className="size-3.5" />
          </Button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs text-muted transition-colors hover:text-foreground"
        >
          <Plus className="size-3" />
          Application
        </button>
      )}
    </div>
  );
}
