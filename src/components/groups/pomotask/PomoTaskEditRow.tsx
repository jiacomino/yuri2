import { useState } from "react";
import { Input } from "@heroui/react";
import { EstimateChips } from "./EstimateChips";
import type { PomoTask } from "./state";

type PomoTaskEditRowProps = {
  task: PomoTask;
  /** Texte vide = suppression de la tâche (comme dans yuri). */
  onCommit: (text: string) => void;
  onCancel: () => void;
  onChangeEstimate: (minutes: number) => void;
};

/** Édition en ligne : Entrée ou perte de focus valide, Échap annule. */
export function PomoTaskEditRow({ task, onCommit, onCancel, onChangeEstimate }: PomoTaskEditRowProps) {
  const [draft, setDraft] = useState(task.text);

  return (
    <li className="flex flex-col gap-2 rounded-[10px] bg-surface p-2.5 shadow-[0_1px_2px_rgba(16,24,40,.08)] ring-1 ring-accent/40">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onCommit(draft);
        }}
      >
        <Input
          autoFocus
          value={draft}
          aria-label="Texte de la tâche"
          onChange={(e) => setDraft(e.currentTarget.value)}
          onBlur={() => onCommit(draft)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              onCancel();
            }
          }}
          className="w-full"
        />
      </form>
      <EstimateChips value={task.estimateMin} onChange={onChangeEstimate} className="justify-start" />
    </li>
  );
}
