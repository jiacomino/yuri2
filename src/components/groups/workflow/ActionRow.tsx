import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@heroui/react";
import { ArrowRight, ChevronDown, ChevronUp, GripVertical, RotateCcw } from "lucide-react";
import { AlarmControl } from "@/components/shared/AlarmControl";
import { cn } from "@/lib/utils";
import { ActionBadges } from "./ActionBadges";
import { ActionDetails } from "./ActionDetails";
import { useWorkflow } from "./context";
import { PriorityMenu } from "./PriorityMenu";
import type { WorkflowAction } from "./state";
import { StatusButton } from "./StatusButton";

/** Taille des boutons-icônes dans la ligne compacte d'une action. */
export const rowIconButtonClass = "size-7 min-w-7 shrink-0";

type ActionRowProps = {
  action: WorkflowAction;
  expanded: boolean;
  onToggleExpand: () => void;
};

/** Carte d'une action : ligne compacte triable, et détails dépliables. */
export function ActionRow({ action, expanded, onToggleExpand }: ActionRowProps) {
  const { state, ops, blockersOf } = useWorkflow();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: action.id });

  const stepIdx = state.steps.findIndex((s) => s.id === action.stepId);
  const currentStep = state.steps[stepIdx];
  const nextStep = state.steps[stepIdx + 1];
  const done = action.status === "done";
  const blockers = blockersOf(action);
  const blocked = blockers.length > 0;
  const app = state.apps.find((a) => a.id === action.appId);
  const blockedTitle = `Bloquée par : ${blockers.map((b) => b.title).join(", ")}`;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "list-card rounded-[10px] bg-surface text-[0.9259rem] shadow-[0_1px_2px_rgba(16,24,40,.08)]",
        blocked && "outline-1 outline-offset-[-1px] outline-amber-500/50 outline-dashed",
        isDragging && "opacity-40",
      )}
    >
      <div className="flex items-center gap-1 px-1 pt-1 pb-1">
        <button
          type="button"
          className="grid h-7 w-4 shrink-0 cursor-grab touch-none place-items-center text-muted/40 hover:text-muted active:cursor-grabbing"
          aria-label="Déplacer"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3.5" />
        </button>
        <StatusButton status={action.status} onPress={() => ops.cycleStatus(action)} />
        <PriorityMenu value={action.priority} onChange={(priority) => ops.patch(action.id, { priority })} />
        <button
          type="button"
          onClick={onToggleExpand}
          className="min-w-0 flex-1 cursor-pointer py-1 text-left"
          title={action.title}
        >
          <span className={cn("block truncate font-semibold", done && "font-medium text-muted line-through")}>{action.title}</span>
        </button>


        <AlarmControl
          alarmAt={action.alarmAt}
          alarmFired={action.alarmFired}
          onChange={(alarmAt) => ops.setAlarm(action.id, alarmAt)}
          label={action.title}
          className={rowIconButtonClass}
        />
        {done ? (
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label="Rouvrir (étape précédente)"
            className={rowIconButtonClass}
            onPress={() => ops.reopen(action)}
          >
            <span title="Rouvrir (étape précédente)">
              <RotateCcw className="size-3.5" />
            </span>
          </Button>
        ) : (
          // Un bouton désactivé ne reçoit pas le survol : l'info-bulle est portée par l'enveloppe.
          <span title={blocked ? blockedTitle : nextStep ? `Passer à « ${nextStep.name} »` : "Dernière étape"}>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label="Étape suivante"
              className={rowIconButtonClass}
              isDisabled={!nextStep || blocked}
              onPress={() => void ops.advance(action)}
            >
              <ArrowRight className="size-3.5" />
            </Button>
          </span>
        )}
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          aria-label={expanded ? "Replier" : "Détails"}
          aria-expanded={expanded}
          className={rowIconButtonClass}
          onPress={onToggleExpand}
        >
          {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </Button>
      </div>

      {/* Pastilles de méta-informations ; la ligne disparaît quand il n'y en a aucune. */}
      <div className="-mt-0.5 flex flex-wrap items-center gap-1 pr-2.5 pb-2 pl-6 empty:hidden">
        <ActionBadges action={action} app={app} stepName={currentStep?.name ?? ""} blockers={blockers} />
      </div>

      {expanded && <ActionDetails action={action} currentStepName={currentStep?.name ?? ""} blockers={blockers} />}
    </li>
  );
}
