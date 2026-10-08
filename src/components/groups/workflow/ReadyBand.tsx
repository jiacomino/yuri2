import { Flag, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIORITY_META } from "./priority";
import { READY_LIMIT, formatDue, stepColor, todayISO, type WorkflowAction, type WorkflowStep } from "./state";
import { Dot, SectionLabel } from "./ui";

type ReadyBandProps = {
  ready: WorkflowAction[];
  blockedCount: number;
  steps: WorkflowStep[];
  onOpen: (actionId: string) => void;
};

/** « Prochaines actions » : ce qu'on peut réellement démarrer maintenant. */
export function ReadyBand({ ready, blockedCount, steps, onOpen }: ReadyBandProps) {
  const today = todayISO();
  return (
    <div className="shrink-0 rounded-xl bg-surface-secondary p-2.5">
      <SectionLabel icon={<Zap className="size-3.5 text-amber-500" />}>
        Prochaines actions
        <span className="font-semibold normal-case tracking-normal">
          · {ready.length} prête{ready.length > 1 ? "s" : ""}
          {blockedCount > 0 && `, ${blockedCount} bloquée${blockedCount > 1 ? "s" : ""}`}
        </span>
      </SectionLabel>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {ready.slice(0, READY_LIMIT).map((a) => {
          const step = steps.find((s) => s.id === a.stepId);
          const tint = step ? stepColor(steps, step) : undefined;
          const overdue = !!a.due && a.due < today;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onOpen(a.id)}
              title={`${a.title} — ${step?.name ?? ""}`}
              className="inline-flex max-w-full cursor-pointer items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-xs font-semibold shadow-[0_1px_2px_rgba(16,24,40,.08)] transition-shadow hover:shadow-[0_2px_8px_rgba(16,24,40,.10)]"
            >
              {tint && <Dot color={tint} />}
              <Flag className={cn("size-3 shrink-0", PRIORITY_META[a.priority].text)} />
              <span className="max-w-48 truncate">{a.title}</span>
              {a.due && (
                <span className={cn("tabular-nums", overdue ? "font-medium text-danger" : "text-muted")}>
                  {formatDue(a.due)}
                </span>
              )}
            </button>
          );
        })}
        {ready.length > READY_LIMIT && (
          <span className="self-center text-xs text-muted">+{ready.length - READY_LIMIT}</span>
        )}
      </div>
    </div>
  );
}
