import { useEffect, useState } from "react";
import { Button, Input, TextArea } from "@heroui/react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import type { WorkflowStep } from "./state";
import { ColorInput, compactInputClass } from "./ui";

type StepEditorRowProps = {
  step: WorkflowStep;
  index: number;
  count: number;
  /** Teinte résolue (propre ou par défaut), affichée dans le sélecteur. */
  color: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canRemove: boolean;
  onRename: (name: string) => void;
  onSetCriteria: (criteria: string[]) => void;
  onSetColor: (color: string) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
};

export function StepEditorRow({
  step,
  index,
  count,
  color,
  canMoveUp,
  canMoveDown,
  canRemove,
  onRename,
  onSetCriteria,
  onSetColor,
  onMove,
  onRemove,
}: StepEditorRowProps) {
  // Brouillons locaux : valider à chaque frappe gênerait la saisie (nom vide refusé,
  // critères découpés par ligne). On valide au blur.
  const [name, setName] = useState(step.name);
  const [criteria, setCriteria] = useState(step.exitCriteria.join("\n"));

  useEffect(() => setName(step.name), [step.name]);
  useEffect(() => setCriteria(step.exitCriteria.join("\n")), [step.exitCriteria]);

  function commitName() {
    if (name.trim()) onRename(name);
    else setName(step.name);
  }

  function commitCriteria() {
    onSetCriteria(
      criteria
        .split("\n")
        .map((c) => c.trim())
        .filter(Boolean),
    );
  }

  return (
    <div
      className="flex flex-col gap-1.5 rounded-[10px] bg-surface p-2.5 shadow-[0_1px_2px_rgba(16,24,40,.08)]">
      <div className="flex items-center gap-1.5">
        <span
          className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[0.7407rem] font-bold tabular-nums"
          style={{
            backgroundColor: `color-mix(in oklab, ${color} 16%, transparent)`,
            color: `color-mix(in oklab, ${color} 80%, var(--foreground))`,
          }}
        >
          {index + 1}
        </span>
        <ColorInput value={color} onChange={onSetColor} label={`Couleur de l'étape ${step.name}`} />
        <Input
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          aria-label="Nom de l'étape"
          className={`${compactInputClass} min-w-0 flex-1`}
        />
        <span className="shrink-0 text-xs tabular-nums text-muted" title="Actions dans cette étape">
          {count}
        </span>
        <Button isIconOnly size="sm" variant="ghost" aria-label="Monter" isDisabled={!canMoveUp} onPress={() => onMove(-1)}>
          <ChevronUp className="size-4" />
        </Button>
        <Button isIconOnly size="sm" variant="ghost" aria-label="Descendre" isDisabled={!canMoveDown} onPress={() => onMove(1)}>
          <ChevronDown className="size-4" />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          aria-label="Supprimer l'étape"
          className="text-danger"
          isDisabled={!canRemove}
          onPress={onRemove}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      <TextArea
        value={criteria}
        onChange={(e) => setCriteria(e.currentTarget.value)}
        onBlur={commitCriteria}
        rows={2}
        placeholder="Critères de sortie, un par ligne…"
        aria-label="Critères de sortie"
        className="resize-y px-2.5 py-1.5 text-xs sm:text-xs"
      />
    </div>
  );
}
