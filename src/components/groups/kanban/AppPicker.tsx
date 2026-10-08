import { useState } from "react";
import { Button, Input } from "@heroui/react";
import { Check, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { appChipStyle, nextAppColor } from "./meta";
import type { AppTag } from "./state";

type AppPickerProps = {
  apps: AppTag[];
  value: string | undefined;
  onChange: (appId: string | undefined) => void;
  /** Crée une application et renvoie son id pour la sélectionner. */
  onCreateApp: (name: string, color: string) => string | undefined;
};

/** Pastilles de choix d'application, avec création à la volée. */
export function AppPicker({ apps, value, onChange, onCreateApp }: AppPickerProps) {
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftColor, setDraftColor] = useState(() => nextAppColor(apps.length));

  function commitNew() {
    const clean = draft.trim();
    if (!clean) {
      setCreating(false);
      return;
    }
    const id = onCreateApp(clean, draftColor);
    if (id) onChange(id);
    setDraft("");
    setDraftColor(nextAppColor(apps.length + 1));
    setCreating(false);
  }

  function cancelNew() {
    setDraft("");
    setCreating(false);
  }

  const chip = "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.8148rem] transition-all";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        aria-pressed={!value}
        onClick={() => onChange(undefined)}
        className={cn(chip, "bg-default text-muted", !value ? "ring-2 ring-accent/50" : "opacity-60 hover:opacity-100")}
      >
        Aucune
      </button>
      {apps.map((app) => {
        const active = value === app.id;
        return (
          <button
            key={app.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(app.id)}
            title={app.name}
            style={appChipStyle(app.color)}
            className={cn(chip, active ? "ring-2 ring-accent/50" : "opacity-60 hover:opacity-100")}
          >
            <span className="size-1.5 rounded-full" style={{ backgroundColor: app.color }} />
            {app.name}
          </button>
        );
      })}

      {creating ? (
        // Pas de validation au blur : le sélecteur de couleur natif fait perdre le focus.
        <span className="inline-flex items-center gap-1">
          <input
            type="color"
            value={draftColor}
            onChange={(e) => setDraftColor(e.currentTarget.value)}
            aria-label="Couleur de la nouvelle application"
            className="size-6 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
          />
          <Input
            autoFocus
            aria-label="Nom de l'application"
            placeholder="Nom de l'application"
            value={draft}
            onChange={(e) => setDraft(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitNew();
              } else if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                cancelNew();
              }
            }}
            className="h-6 w-36 rounded-lg px-2 py-0 text-xs"
          />
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label="Créer l'application"
            isDisabled={!draft.trim()}
            onPress={commitNew}
            className="size-6 min-w-6"
          >
            <Check className="size-3.5" />
          </Button>
          <Button isIconOnly size="sm" variant="ghost" aria-label="Annuler" onPress={cancelNew} className="size-6 min-w-6">
            <X className="size-3.5" />
          </Button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className={cn(chip, "border border-dashed border-border text-muted hover:text-foreground")}
        >
          <Plus className="size-3" />
          Application
        </button>
      )}
    </div>
  );
}
