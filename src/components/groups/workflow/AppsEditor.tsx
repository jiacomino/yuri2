import { useState } from "react";
import { Button, Input } from "@heroui/react";
import { Plus, X } from "lucide-react";
import { AppBadge } from "./AppChip";
import { useWorkflow } from "./context";
import { nextAppColor } from "./state";
import { ColorInput, compactInputClass } from "./ui";

type AppsEditorProps = {
  onRemove: (appId: string) => void;
};

/** Contenu du popover « Applications » : renommer, recolorer, supprimer, créer. */
export function AppsEditor({ onRemove }: AppsEditorProps) {
  const { state, ops } = useWorkflow();
  const apps = state.apps;
  const [draft, setDraft] = useState("");
  const [draftColor, setDraftColor] = useState(() => nextAppColor(apps.length));

  function submit() {
    const clean = draft.trim();
    if (!clean) return;
    ops.createApp(clean, draftColor);
    setDraft("");
    setDraftColor(nextAppColor(apps.length + 1));
  }

  return (
    <div className="flex w-72 flex-col gap-2 p-3">
      <span className="text-[0.8148rem] font-bold uppercase tracking-[.06em] text-muted">Applications du workflow</span>
      <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto">
        {apps.length === 0 && (
          <p className="text-xs text-muted">Aucune application. Ajoutez-en une ci-dessous pour y affecter des actions.</p>
        )}
        {apps.map((app) => (
          <div key={app.id} className="flex items-center gap-1.5">
            <ColorInput
              value={app.color}
              onChange={(color) => ops.updateApp(app.id, { color })}
              label={`Couleur de ${app.name}`}
            />
            <Input
              value={app.name}
              onChange={(e) => ops.updateApp(app.id, { name: e.currentTarget.value })}
              onBlur={(e) => {
                if (!e.currentTarget.value.trim()) ops.updateApp(app.id, { name: "Sans nom" });
              }}
              aria-label={`Nom de ${app.name}`}
              className={`${compactInputClass} min-w-0 flex-1`}
            />
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label={`Supprimer ${app.name}`}
              className="text-muted hover:text-danger"
              onPress={() => onRemove(app.id)}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <form
        className="flex flex-col gap-2 border-t border-separator pt-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="flex items-center gap-1.5">
          <ColorInput value={draftColor} onChange={setDraftColor} label="Couleur de la nouvelle application" />
          <Input
            value={draft}
            onChange={(e) => setDraft(e.currentTarget.value)}
            placeholder="Nouvelle application"
            aria-label="Nouvelle application"
            className={`${compactInputClass} min-w-0 flex-1`}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          {/* Aperçu de la pastille que porteront les actions. */}
          <AppBadge app={{ id: "apercu", name: draft.trim() || "Aperçu", color: draftColor }} />
          <Button type="submit" size="sm" variant="primary" isDisabled={!draft.trim()}>
            <Plus className="size-3.5" />
            Ajouter
          </Button>
        </div>
      </form>
    </div>
  );
}
