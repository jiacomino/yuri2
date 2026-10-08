import { useState } from "react";
import { Button, Input } from "@heroui/react";
import { ListChecks, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkflow } from "./context";
import type { WorkflowAction } from "./state";
import { SectionLabel, compactInputClass } from "./ui";

type ChecklistEditorProps = {
  action: WorkflowAction;
  stepName: string;
};

/** Critères de sortie de l'étape courante, cochables, plus ceux ajoutés à la main. */
export function ChecklistEditor({ action, stepName }: ChecklistEditorProps) {
  const { ops } = useWorkflow();
  const [draft, setDraft] = useState("");
  const checked = action.checklist.filter((c) => c.done).length;
  const total = action.checklist.length;
  const progress = total > 0 ? Math.round((checked / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-surface-secondary p-2.5">
      <div className="flex items-center gap-2">
        <SectionLabel icon={<ListChecks className="size-3.5" />} className="min-w-0 flex-1 truncate">
          Critères de sortie · {stepName}
        </SectionLabel>
        <span className="shrink-0 text-[0.8148rem] font-semibold tabular-nums text-muted">
          {checked}/{total}
        </span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-default"
        role="progressbar"
        aria-label="Critères cochés"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${progress}%` }} />
      </div>
      <ul className="flex flex-col">
        {action.checklist.map((c) => (
          <li key={c.id} className="group/item flex items-center gap-2 rounded-lg px-1.5 py-0.5 hover:bg-surface">
            <input
              type="checkbox"
              checked={c.done}
              onChange={() => ops.toggleChecklist(action.id, c.id)}
              className="size-[15px] shrink-0 cursor-pointer accent-[var(--accent)]"
              aria-label={c.done ? `Décocher « ${c.label} »` : `Cocher « ${c.label} »`}
            />
            <span className={cn("min-w-0 flex-1 truncate text-xs font-medium", c.done && "text-muted line-through")}>
              {c.label}
            </span>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label="Retirer le critère"
              className="size-6 min-w-6 opacity-0 group-hover/item:opacity-100 focus-visible:opacity-100"
              onPress={() => ops.removeChecklistItem(action.id, c.id)}
            >
              <X className="size-3.5" />
            </Button>
          </li>
        ))}
      </ul>
      <form
        className="flex items-center gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          ops.addChecklistItem(action.id, draft);
          setDraft("");
        }}
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.currentTarget.value)}
          placeholder="Ajouter un critère…"
          aria-label="Ajouter un critère"
          className={`${compactInputClass} min-w-0 flex-1`}
        />
        <Button type="submit" isIconOnly size="sm" variant="ghost" aria-label="Ajouter le critère" isDisabled={!draft.trim()}>
          <Plus className="size-4" />
        </Button>
      </form>
    </div>
  );
}
