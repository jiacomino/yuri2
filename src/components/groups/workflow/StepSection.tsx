import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@heroui/react";
import { ListChecks, Plus } from "lucide-react";
import { ActionRow } from "./ActionRow";
import { AddActionForm } from "./AddActionForm";
import type { WorkflowAction, WorkflowStep } from "./state";
import { Dot } from "./ui";

type StepSectionProps = {
  step: WorkflowStep;
  color: string;
  /** Position de l'étape dans le processus (0 = première). */
  index: number;
  isLast: boolean;
  actions: WorkflowAction[];
  expandedId: string | null;
  onToggleExpand: (actionId: string) => void;
  adding: boolean;
  onStartAdd: () => void;
  onCancelAdd: () => void;
  onSubmitAdd: (title: string) => void;
};

/** Une étape : zone de dépôt, liste triable de ses actions et saisie rapide. */
export function StepSection({
  step,
  color,
  index,
  isLast,
  actions,
  expandedId,
  onToggleExpand,
  adding,
  onStartAdd,
  onCancelAdd,
  onSubmitAdd,
}: StepSectionProps) {
  const { setNodeRef, isOver } = useDroppable({ id: step.id });

  return (
    <section
      ref={setNodeRef}
      className="flex flex-col gap-2 rounded-xl bg-surface-secondary p-2.5 transition-shadow"
      style={{
        boxShadow: isOver ? `inset 0 0 0 2px color-mix(in oklab, ${color} 60%, transparent)` : undefined,
        backgroundColor: isOver ? `color-mix(in oklab, ${color} 8%, var(--surface-secondary))` : undefined,
      }}
    >
      <header className="flex items-center gap-2 pl-0.5">
        <Dot color={color} />
        <h4 className="truncate text-[0.8889rem] font-bold" title={`Étape ${index + 1}`}>
          {step.name}
        </h4>
        <span className="text-[0.8889rem] font-semibold tabular-nums text-muted">{actions.length}</span>
        {step.exitCriteria.length > 0 && (
          <span
            className="inline-flex items-center gap-0.5 text-[0.8148rem] font-semibold text-muted"
            title={`Critères de sortie : ${step.exitCriteria.join(", ")}`}
          >
            <ListChecks className="size-3.5" />
            {step.exitCriteria.length}
          </span>
        )}
        <span className="flex-1" />
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          aria-label={`Ajouter une action dans « ${step.name} »`}
          className="size-7 min-w-7"
          onPress={onStartAdd}
        >
          <Plus className="size-4" />
        </Button>
      </header>

      <SortableContext items={actions.map((a) => a.id)} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-2">
          {actions.map((action) => (
            <ActionRow
              key={action.id}
              action={action}
              expanded={expandedId === action.id}
              onToggleExpand={() => onToggleExpand(action.id)}
            />
          ))}
          {actions.length === 0 && !adding && (
            <li className="rounded-[10px] border border-dashed border-border px-2.5 py-2 text-[0.8889rem] text-muted">
              {isLast ? "Rien de terminé pour l'instant." : "Aucune action."}
            </li>
          )}
        </ul>
      </SortableContext>

      {adding && <AddActionForm stepName={step.name} onSubmit={onSubmitAdd} onCancel={onCancelAdd} />}
    </section>
  );
}
