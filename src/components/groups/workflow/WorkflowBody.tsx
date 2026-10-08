import { useCallback, useMemo, useState } from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import type { BodyProps } from "../types";
import { AppsBar } from "./AppsBar";
import type { CalendarTarget, SendToCalendar } from "./calendar";
import { WorkflowContext, type WorkflowContextValue } from "./context";
import { DragPreview } from "./DragPreview";
import { PipelineBar } from "./PipelineBar";
import { ReadyBand } from "./ReadyBand";
import { blockersOf, readyQueue, stepColor, type WorkflowAction, type WorkflowState } from "./state";
import { StepSection } from "./StepSection";
import { StepsEditor } from "./StepsEditor";
import { useConfirm } from "./useConfirm";
import { useWorkflowAlarms } from "./useWorkflowAlarms";
import { useWorkflowDnd } from "./useWorkflowDnd";
import { useWorkflowOps } from "./useWorkflowOps";

export type WorkflowBodyProps = BodyProps<WorkflowState> & {
  /**
   * Groupes Calendrier dans lesquels planifier une action. Optionnel : tant que
   * `BodyProps` n'a pas de canal entre groupes, l'option « Calendrier » est masquée.
   */
  calendars?: CalendarTarget[];
  onSendToCalendar?: SendToCalendar;
};

const NO_CALENDARS: CalendarTarget[] = [];

/** Corps du groupe Workflow. Remonté à chaque changement de groupe pour repartir de zéro. */
export function WorkflowBody(props: WorkflowBodyProps) {
  return <WorkflowBoard key={props.groupId} {...props} />;
}

function WorkflowBoard({ value, onChange, calendars = NO_CALENDARS, onSendToCalendar }: WorkflowBodyProps) {
  const { confirm, dialog } = useConfirm();
  const ops = useWorkflowOps(value, onChange, confirm, onSendToCalendar);
  useWorkflowAlarms(value, ops.markAlarmsFired);
  const dnd = useWorkflowDnd(ops.drop);

  const [filterStepId, setFilterStepId] = useState<string | null>(null);
  const [filterAppId, setFilterAppId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addingInStepId, setAddingInStepId] = useState<string | null>(null);
  const [editingSteps, setEditingSteps] = useState(false);

  const { steps, actions } = value;

  const byId = useMemo(() => new Map(actions.map((a) => [a.id, a])), [actions]);
  const getBlockers = useCallback((a: WorkflowAction) => blockersOf(byId, a), [byId]);

  /** Actions retenues par le filtre d'application — les blocages, eux, regardent toutes les actions. */
  const scoped = useMemo(
    () => (filterAppId ? actions.filter((a) => a.appId === filterAppId) : actions),
    [actions, filterAppId],
  );
  const ready = useMemo(() => readyQueue(scoped, byId), [scoped, byId]);
  const blockedCount = scoped.filter((a) => getBlockers(a).length > 0).length;
  const doneCount = scoped.filter((a) => a.status === "done").length;
  const progress = scoped.length > 0 ? Math.round((doneCount / scoped.length) * 100) : 0;
  const counts: Record<string, number> = {};
  for (const s of steps) counts[s.id] = scoped.filter((a) => a.stepId === s.id).length;

  const ctx = useMemo<WorkflowContextValue>(
    () => ({ state: value, byId, blockersOf: getBlockers, ops, calendars }),
    [value, byId, getBlockers, ops, calendars],
  );

  const visibleSteps = filterStepId ? steps.filter((s) => s.id === filterStepId) : steps;
  const activeAction = dnd.activeId ? byId.get(dnd.activeId) : undefined;

  async function removeApp(appId: string) {
    if (await ops.removeApp(appId)) setFilterAppId((cur) => (cur === appId ? null : cur));
  }

  async function removeStep(stepId: string) {
    if (!(await ops.removeStep(stepId))) return;
    setFilterStepId((cur) => (cur === stepId ? null : cur));
    setAddingInStepId((cur) => (cur === stepId ? null : cur));
  }

  return (
    <WorkflowContext value={ctx}>
      <div className="flex h-full flex-col gap-2 text-[0.9259rem]">
        <AppsBar activeAppId={filterAppId} onSelectApp={setFilterAppId} onRemoveApp={(id) => void removeApp(id)} />

        <PipelineBar
          steps={steps}
          counts={counts}
          total={scoped.length}
          progress={progress}
          filterStepId={filterStepId}
          onFilterStep={setFilterStepId}
          onNewAction={() => {
            setEditingSteps(false);
            setFilterStepId(null);
            setAddingInStepId(steps[0]?.id ?? null);
          }}
          editingSteps={editingSteps}
          onToggleEditSteps={() => setEditingSteps((v) => !v)}
        />

        {editingSteps ? (
          <StepsEditor counts={counts} onRemoveStep={(id) => void removeStep(id)} onClose={() => setEditingSteps(false)} />
        ) : (
          ready.length > 0 && (
            <ReadyBand
              ready={ready}
              blockedCount={blockedCount}
              steps={steps}
              onOpen={(id) => {
                setFilterStepId(null);
                setExpandedId(id);
              }}
            />
          )
        )}

        <DndContext {...dnd.contextProps}>
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
            {visibleSteps.map((step) => (
              <StepSection
                key={step.id}
                step={step}
                color={stepColor(steps, step)}
                index={steps.indexOf(step)}
                isLast={steps[steps.length - 1]?.id === step.id}
                actions={scoped.filter((a) => a.stepId === step.id)}
                expandedId={expandedId}
                onToggleExpand={(id) => setExpandedId((cur) => (cur === id ? null : id))}
                adding={addingInStepId === step.id}
                onStartAdd={() => setAddingInStepId(step.id)}
                onCancelAdd={() => setAddingInStepId(null)}
                // Pendant un filtre par application, les nouvelles actions y sont affectées.
                onSubmitAdd={(title) => ops.addAction(step.id, title, filterAppId ?? undefined)}
              />
            ))}
          </div>
          <DragOverlay dropAnimation={null}>{activeAction ? <DragPreview action={activeAction} /> : null}</DragOverlay>
        </DndContext>

        {dialog}
      </div>
    </WorkflowContext>
  );
}
