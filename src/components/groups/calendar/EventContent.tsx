import { Flag } from "lucide-react";
import { isUrgent, PRIORITY_META } from "./meta";
import type { AppTag, CalendarTask } from "./state";

type EventContentProps = {
  task: CalendarTask | undefined;
  app: AppTag | undefined;
  title: string;
  timeText: string;
};

/** Contenu d'une tâche dans la grille : titre d'abord (drapeau, point d'application), heure dessous. */
export function EventContent({ task, app, title, timeText }: EventContentProps) {
  const urgent = task && isUrgent(task.priority);
  return (
    <div className="cal-event-content">
      <div className="cal-event-title">
        {urgent && <Flag className="size-2.5 shrink-0" style={{ color: PRIORITY_META[task.priority].hex }} />}
        {app && (
          <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: app.color }} title={app.name} />
        )}
        <span className="truncate font-semibold">{title}</span>
      </div>
      {timeText && <span className="truncate text-[0.92em] font-medium opacity-70 tabular-nums">{timeText}</span>}
    </div>
  );
}
