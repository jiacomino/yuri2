import { CalendarDays, Hourglass, ListChecks, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppBadge } from "./AppChip";
import { PRIORITY_META, chipClass } from "./priority";
import { STALE_DAYS, daysSince, formatDue, todayISO, type AppTag, type WorkflowAction } from "./state";

type ActionBadgesProps = {
  action: WorkflowAction;
  app: AppTag | undefined;
  stepName: string;
  blockers: WorkflowAction[];
};

/** Classes des pastilles d'alerte (ancienneté, blocage). */
const warnChip = "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";

/** Méta-informations compactes d'une action : priorité, application, responsable, critères, échéance, ancienneté, blocage. */
export function ActionBadges({ action, app, stepName, blockers }: ActionBadgesProps) {
  const done = action.status === "done";
  const age = daysSince(action.enteredAt);
  const stale = !done && age >= STALE_DAYS;
  const overdue = !!action.due && !done && action.due < todayISO();
  const checked = action.checklist.filter((c) => c.done).length;
  const total = action.checklist.length;
  const priority = PRIORITY_META[action.priority];

  return (
    <>
      {/* « Normal » est la valeur par défaut : seule une priorité marquée mérite une pastille. */}
      {!done && action.priority !== "normal" && (
        <span className={cn(chipClass, priority.chip)} title="Priorité">
          {priority.label}
        </span>
      )}
      {app && <AppBadge app={app} className="max-w-32" />}
      {action.owner && (
        <span className={cn(chipClass, "max-w-24 bg-default text-muted")} title="Responsable">
          <span className="truncate">{action.owner}</span>
        </span>
      )}
      {total > 0 && (
        <span
          className={cn(
            chipClass,
            "tabular-nums",
            checked === total
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
              : "bg-default text-muted",
          )}
          title="Critères de sortie cochés"
        >
          <ListChecks className="size-3" />
          {checked}/{total}
        </span>
      )}
      {action.due && (
        <span
          className={cn(
            chipClass,
            "tabular-nums",
            overdue ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300" : "bg-default text-muted",
          )}
          title={overdue ? "En retard" : "Échéance"}
        >
          <CalendarDays className="size-3" />
          {formatDue(action.due)}
        </span>
      )}
      {stale && (
        <span className={cn(chipClass, "tabular-nums", warnChip)} title={`${age} jours dans « ${stepName} »`}>
          <Hourglass className="size-3" />
          {age}j
        </span>
      )}
      {blockers.length > 0 && (
        <span className={cn(chipClass, warnChip)} title={`Bloquée par : ${blockers.map((b) => b.title).join(", ")}`}>
          <Lock className="size-3" />
          {blockers.length}
        </span>
      )}
    </>
  );
}
