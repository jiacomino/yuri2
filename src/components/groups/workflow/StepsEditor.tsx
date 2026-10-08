import { useState } from "react";
import { Button, Input } from "@heroui/react";
import { Plus, Settings2, X } from "lucide-react";
import { useWorkflow } from "./context";
import { StepEditorRow } from "./StepEditorRow";
import { stepColor } from "./state";
import { SectionLabel, compactInputClass } from "./ui";

type StepsEditorProps = {
  counts: Record<string, number>;
  onRemoveStep: (stepId: string) => void;
  onClose: () => void;
};

/** Panneau de configuration des étapes : nom, couleur, ordre, critères de sortie. */
export function StepsEditor({ counts, onRemoveStep, onClose }: StepsEditorProps) {
  const { state, ops } = useWorkflow();
  const steps = state.steps;
  const [draft, setDraft] = useState("");

  return (
    <div className="flex max-h-[55%] shrink-0 flex-col gap-2 overflow-y-auto rounded-xl bg-surface-secondary p-2.5">
      <div className="flex items-center gap-1">
        <SectionLabel icon={<Settings2 className="size-3.5" />} className="flex-1">
          Étapes du workflow
        </SectionLabel>
        <Button isIconOnly size="sm" variant="ghost" aria-label="Fermer" onPress={onClose}>
          <X className="size-4" />
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {steps.map((step, i) => (
          <StepEditorRow
            key={step.id}
            step={step}
            index={i}
            count={counts[step.id] ?? 0}
            color={stepColor(steps, step)}
            canMoveUp={i > 0}
            canMoveDown={i < steps.length - 1}
            canRemove={steps.length > 1}
            onRename={(name) => ops.renameStep(step.id, name)}
            onSetCriteria={(criteria) => ops.setStepCriteria(step.id, criteria)}
            onSetColor={(color) => ops.setStepColor(step.id, color)}
            onMove={(dir) => ops.moveStep(step.id, dir)}
            onRemove={() => onRemoveStep(step.id)}
          />
        ))}
      </div>
      <form
        className="flex items-center gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          ops.addStep(draft);
          setDraft("");
        }}
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.currentTarget.value)}
          placeholder="Nouvelle étape…"
          aria-label="Nouvelle étape"
          className={`${compactInputClass} min-w-0 flex-1`}
        />
        <Button type="submit" size="sm" variant="primary" isDisabled={!draft.trim()}>
          <Plus className="size-3.5" />
          Étape
        </Button>
      </form>
    </div>
  );
}
