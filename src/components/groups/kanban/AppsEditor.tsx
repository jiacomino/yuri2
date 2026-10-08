import { useState } from "react";
import { Button, Input } from "@heroui/react";
import { Plus, X } from "lucide-react";
import { AppBadge } from "./AppBadge";
import { nextAppColor } from "./meta";
import type { AppTag } from "./state";

export type AppsEditorProps = {
  apps: AppTag[];
  onAddApp: (name: string, color: string) => void;
  onUpdateApp: (appId: string, patch: Partial<Omit<AppTag, "id">>) => void;
  onRemoveApp: (appId: string) => void;
};

/** Contenu du popover « Applications » : renommer, recolorer, supprimer, créer. */
export function AppsEditor({ apps, onAddApp, onUpdateApp, onRemoveApp }: AppsEditorProps) {
  const [draft, setDraft] = useState("");
  const [draftColor, setDraftColor] = useState(() => nextAppColor(apps.length));

  function submitNew() {
    const clean = draft.trim();
    if (!clean) return;
    onAddApp(clean, draftColor);
    setDraft("");
    setDraftColor(nextAppColor(apps.length + 1));
  }

  return (
    <div className="flex w-72 flex-col gap-2 p-3">
      <span className="text-xs font-medium text-muted">Applications du tableau</span>

      <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto">
        {apps.length === 0 && (
          <p className="text-xs text-muted">Aucune application. Ajoutez-en une ci-dessous pour y affecter des cartes.</p>
        )}
        {apps.map((app) => (
          <div key={app.id} className="flex items-center gap-1.5">
            <input
              type="color"
              value={app.color}
              onChange={(e) => onUpdateApp(app.id, { color: e.currentTarget.value })}
              aria-label={`Couleur de ${app.name}`}
              className="size-7 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
            />
            <Input
              aria-label={`Nom de ${app.name}`}
              value={app.name}
              onChange={(e) => onUpdateApp(app.id, { name: e.currentTarget.value })}
              onBlur={(e) => {
                if (!e.currentTarget.value.trim()) onUpdateApp(app.id, { name: "Sans nom" });
              }}
              className="h-7 flex-1 rounded-lg px-2 py-0 text-xs"
            />
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label={`Supprimer ${app.name}`}
              onPress={() => onRemoveApp(app.id)}
              className="size-7 min-w-7 text-muted hover:text-danger"
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
          submitNew();
        }}
      >
        <div className="flex items-center gap-1.5">
          <input
            type="color"
            value={draftColor}
            onChange={(e) => setDraftColor(e.currentTarget.value)}
            aria-label="Couleur de la nouvelle application"
            className="size-7 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
          />
          <Input
            aria-label="Nouvelle application"
            placeholder="Nouvelle application"
            value={draft}
            onChange={(e) => setDraft(e.currentTarget.value)}
            className="h-7 flex-1 rounded-lg px-2 py-0 text-xs"
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          {/* Aperçu de la pastille portée par les cartes. */}
          <AppBadge app={{ name: draft.trim() || "Aperçu", color: draftColor }} />
          <Button type="submit" size="sm" variant="primary" isDisabled={!draft.trim()}>
            <Plus className="size-3.5" />
            Ajouter
          </Button>
        </div>
      </form>
    </div>
  );
}
