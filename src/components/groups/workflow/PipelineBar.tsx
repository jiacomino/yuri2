import { Button } from "@heroui/react";
import { ChevronRight, Plus, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { stepColor, type WorkflowStep } from "./state";
import { Dot } from "./ui";

type PipelineBarProps = {
  steps: WorkflowStep[];
  /** Nombre d'actions (filtrées par application) par étape. */
  counts: Record<string, number>;
  total: number;
  progress: number;
  filterStepId: string | null;
  onFilterStep: (stepId: string | null) => void;
  onNewAction: () => void;
  editingSteps: boolean;
  onToggleEditSteps: () => void;
};

/** Pastille d'étape : neutre au repos, accent quand le filtre est actif. */
const pillClass = (active: boolean) =>
  cn(
    "inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.8889rem] font-semibold transition-colors",
    active ? "bg-accent text-accent-foreground" : "bg-default text-muted hover:text-foreground",
  );

/** Le processus lui-même, cliquable comme filtre, avec avancement et réglages. */
export function PipelineBar({
  steps,
  counts,
  total,
  progress,
  filterStepId,
  onFilterStep,
  onNewAction,
  editingSteps,
  onToggleEditSteps,
}: PipelineBarProps) {
  return (
    <div className="flex shrink-0 flex-col gap-2">
      <div className="flex items-center gap-1">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-0.5">
          <button type="button" onClick={() => onFilterStep(null)} className={pillClass(filterStepId === null)}>
            Tout <span className="tabular-nums opacity-70">{total}</span>
          </button>
          {steps.map((step, i) => (
            <StepFilterChip
              key={step.id}
              step={step}
              color={stepColor(steps, step)}
              count={counts[step.id] ?? 0}
              withSeparator={i > 0}
              active={filterStepId === step.id}
              onPress={() => onFilterStep(filterStepId === step.id ? null : step.id)}
            />
          ))}
        </div>
        <span className="shrink-0 pl-1 text-[0.8889rem] font-semibold tabular-nums text-muted" title="Actions terminées">
          {progress}%
        </span>
        <Button isIconOnly size="sm" variant="ghost" aria-label="Nouvelle action" onPress={onNewAction}>
          <Plus className="size-4" />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant={editingSteps ? "secondary" : "ghost"}
          aria-label="Configurer les étapes"
          aria-pressed={editingSteps}
          onPress={onToggleEditSteps}
        >
          <Settings2 className="size-4" />
        </Button>
      </div>
      <ProgressLine progress={progress} />
    </div>
  );
}

type StepFilterChipProps = {
  step: WorkflowStep;
  color: string;
  count: number;
  withSeparator: boolean;
  active: boolean;
  onPress: () => void;
};

function StepFilterChip({ step, color, count, withSeparator, active, onPress }: StepFilterChipProps) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      {withSeparator && <ChevronRight className="size-3 shrink-0 text-muted/50" aria-hidden />}
      <button
        type="button"
        onClick={onPress}
        aria-pressed={active}
        title={step.exitCriteria.length > 0 ? `Critères de sortie : ${step.exitCriteria.join(", ")}` : undefined}
        className={pillClass(active)}
      >
        <Dot color={color} className={cn(active && "ring-2 ring-accent-foreground/40")} />
        {step.name}
        <span className="tabular-nums opacity-70">{count}</span>
      </button>
    </div>
  );
}

function ProgressLine({ progress }: { progress: number }) {
  return (
    <div
      className="h-1.5 shrink-0 overflow-hidden rounded-full bg-default"
      role="progressbar"
      aria-label="Avancement"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${progress}%` }} />
    </div>
  );
}
