import { useState } from "react";
import { Button, Input } from "@heroui/react";
import { Check, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppChip } from "./AppChip";
import { useWorkflow } from "./context";
import { nextAppColor } from "./state";
import { ColorInput, compactInputClass } from "./ui";

type AppPickerProps = {
  value: string | undefined;
  onChange: (appId: string | undefined) => void;
};

/** Rangée de pastilles pour affecter une application, avec création à la volée. */
export function AppPicker({ value, onChange }: AppPickerProps) {
  const { state, ops } = useWorkflow();
  const apps = state.apps;
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftColor, setDraftColor] = useState(() => nextAppColor(apps.length));

  function cancel() {
    setDraft("");
    setCreating(false);
  }

  function commit() {
    const clean = draft.trim();
    if (!clean) return cancel();
    const id = ops.createApp(clean, draftColor);
    if (id) onChange(id);
    setDraftColor(nextAppColor(apps.length + 1));
    cancel();
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="w-full text-[0.8148rem] font-medium uppercase tracking-wider text-muted">Application</span>
      <button
        type="button"
        onClick={() => onChange(undefined)}
        aria-pressed={!value}
        className={cn(
          "inline-flex cursor-pointer items-center rounded-full bg-surface-secondary px-2 py-0.5 text-[0.8148rem] text-muted transition-all",
          !value ? "ring-2 ring-accent/30" : "opacity-70 hover:opacity-100",
        )}
      >
        Aucune
      </button>
      {apps.map((app) => (
        <AppChip key={app.id} app={app} active={value === app.id} onPress={() => onChange(app.id)} />
      ))}
      {creating ? (
        // Pas de validation au blur : ouvrir la palette native fait perdre le focus au champ.
        <span className="inline-flex items-center gap-1">
          <ColorInput value={draftColor} onChange={setDraftColor} label="Couleur de la nouvelle application" />
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancel();
              }
            }}
            placeholder="Nom de l'application"
            aria-label="Nom de l'application"
            className={`${compactInputClass} w-40`}
          />
          <Button isIconOnly size="sm" variant="ghost" aria-label="Créer l'application" isDisabled={!draft.trim()} onPress={commit}>
            <Check className="size-3.5" />
          </Button>
          <Button isIconOnly size="sm" variant="ghost" aria-label="Annuler la création" onPress={cancel}>
            <X className="size-3.5" />
          </Button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex cursor-pointer items-center gap-0.5 rounded-full border border-dashed border-border px-2 py-0.5 text-[0.8148rem] text-muted transition-colors hover:text-foreground"
        >
          <Plus className="size-3" />
          Application
        </button>
      )}
    </div>
  );
}
