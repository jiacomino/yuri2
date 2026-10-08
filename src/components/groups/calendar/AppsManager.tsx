import { useState } from "react";
import { Button, Input } from "@heroui/react";
import { Plus, X } from "lucide-react";
import { AppChip } from "./AppChip";
import { ColorInput } from "./ColorInput";
import { nextColor } from "./meta";
import type { AppTag } from "./state";

type AppsManagerProps = {
  apps: AppTag[];
  onAdd: (name: string, color: string) => void;
  onUpdate: (appId: string, patch: Partial<Omit<AppTag, "id">>) => void;
  onRemove: (appId: string) => void;
};

/** Contenu du popover « Applications » : renommer, recolorer, supprimer, ajouter. */
export function AppsManager({ apps, onAdd, onUpdate, onRemove }: AppsManagerProps) {
  const [draft, setDraft] = useState("");
  const [draftColor, setDraftColor] = useState(() => nextColor(apps.length));

  function submit() {
    const name = draft.trim();
    if (!name) return;
    onAdd(name, draftColor);
    setDraft("");
    setDraftColor(nextColor(apps.length + 1));
  }

  return (
    <div className="flex w-72 flex-col gap-2">
      <p className="text-xs font-medium text-muted">Applications du calendrier</p>

      <div className="flex max-h-56 flex-col gap-1 overflow-y-auto">
        {apps.length === 0 && (
          <p className="rounded-xl bg-surface-secondary px-2.5 py-2 text-xs text-muted">
            Aucune application. Ajoutez-en une pour y rattacher vos tâches.
          </p>
        )}
        {apps.map((app) => (
          <div key={app.id} className="flex items-center gap-1.5">
            <ColorInput value={app.color} onChange={(color) => onUpdate(app.id, { color })} label={`Couleur de ${app.name}`} />
            <Input
              aria-label={`Nom de ${app.name}`}
              value={app.name}
              onChange={(e) => onUpdate(app.id, { name: e.currentTarget.value })}
              onBlur={(e) => {
                if (!e.currentTarget.value.trim()) onUpdate(app.id, { name: "Sans nom" });
              }}
              className="h-8 flex-1 text-[0.9259rem]"
            />
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label={`Supprimer ${app.name}`}
              onPress={() => onRemove(app.id)}
              className="text-muted hover:text-danger"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <form
        className="flex flex-col gap-2 border-t border-border pt-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="flex items-center gap-1.5">
          <ColorInput value={draftColor} onChange={setDraftColor} label="Couleur de la nouvelle application" />
          <Input
            aria-label="Nouvelle application"
            value={draft}
            onChange={(e) => setDraft(e.currentTarget.value)}
            placeholder="Nouvelle application"
            className="h-8 flex-1 text-[0.9259rem]"
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <AppChip app={{ name: draft.trim() || "Aperçu", color: draftColor }} />
          <Button type="submit" size="sm" variant="primary" isDisabled={!draft.trim()}>
            <Plus className="size-3.5" />
            Ajouter
          </Button>
        </div>
      </form>
    </div>
  );
}
