import { Button, Input, TextArea } from "@heroui/react";
import { Lock, Trash2 } from "lucide-react";
import { AppPicker } from "./AppPicker";
import { ChecklistEditor } from "./ChecklistEditor";
import { useWorkflow } from "./context";
import { DependencyMenu } from "./DependencyMenu";
import { PriorityMenu } from "./PriorityMenu";
import { ScheduleInCalendarPopover } from "./ScheduleInCalendarPopover";
import type { WorkflowAction } from "./state";
import { StepMenu } from "./StepMenu";
import { compactInputClass, nativeFieldClass } from "./ui";

type ActionDetailsProps = {
  action: WorkflowAction;
  currentStepName: string;
  blockers: WorkflowAction[];
};

/** Panneau déplié d'une action : tous ses champs éditables. */
export function ActionDetails({ action, currentStepName, blockers }: ActionDetailsProps) {
  const { ops, calendars } = useWorkflow();
  const patch = (p: Partial<WorkflowAction>) => ops.patch(action.id, p);

  return (
    <div className="flex flex-col gap-2 border-t border-separator px-2.5 pt-2.5 pb-2.5">
      <Input
        value={action.title}
        onChange={(e) => patch({ title: e.currentTarget.value })}
        placeholder="Intitulé de l'action"
        aria-label="Intitulé de l'action"
        className={compactInputClass}
      />
      <TextArea
        value={action.notes}
        onChange={(e) => patch({ notes: e.currentTarget.value })}
        rows={5}
        placeholder="Notes…"
        aria-label="Notes"
        className="min-h-28 resize-y px-2.5 py-1.5 text-xs sm:text-xs"
      />

      <AppPicker value={action.appId} onChange={(appId) => ops.setApp(action.id, appId)} />

      <div className="flex flex-wrap items-center gap-1.5">
        <PriorityMenu variant="button" value={action.priority} onChange={(priority) => patch({ priority })} />
        <Input
          value={action.owner}
          onChange={(e) => patch({ owner: e.currentTarget.value })}
          placeholder="Responsable"
          aria-label="Responsable"
          className={`${compactInputClass} w-32`}
        />
        <input
          type="date"
          value={action.due}
          onChange={(e) => patch({ due: e.currentTarget.value })}
          aria-label="Échéance"
          title="Échéance"
          className={`${nativeFieldClass} w-36`}
        />
        <DependencyMenu action={action} />
        <StepMenu action={action} />
        {calendars.length > 0 && ops.scheduleInCalendar && (
          <ScheduleInCalendarPopover action={action} calendars={calendars} onSchedule={ops.scheduleInCalendar} />
        )}
        <span className="flex-1" />
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          aria-label="Supprimer l'action"
          className="text-danger"
          onPress={() => void ops.remove(action.id)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {blockers.length > 0 && (
        <p className="flex items-start gap-1.5 text-xs text-warning">
          <Lock className="mt-0.5 size-3.5 shrink-0" />
          <span>En attente de : {blockers.map((b) => b.title).join(", ")}</span>
        </p>
      )}

      {/* Affiché seulement quand l'action porte des critères : un bloc vide n'était que du bruit. */}
      {action.checklist.length > 0 && <ChecklistEditor action={action} stepName={currentStepName} />}
    </div>
  );
}
