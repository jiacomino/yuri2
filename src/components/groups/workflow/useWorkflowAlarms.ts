import { useEffect, useRef } from "react";
import { fireAlarmNotification } from "@/lib/alarm";
import { notify } from "@/lib/notify";
import { dueAlarms, type WorkflowState } from "./state";

const ALARM_TICK_MS = 15_000;

/**
 * Surveille les rappels des actions : immédiatement quand un rappel change, puis
 * toutes les 15 s. Un rappel échu et pas encore sonné sonne une fois (son, toast,
 * notification système), puis est marqué `alarmFired`.
 */
export function useWorkflowAlarms(value: WorkflowState, markFired: (ids: Set<string>) => void) {
  const latest = useRef(value);
  latest.current = value;
  const markRef = useRef(markFired);
  markRef.current = markFired;

  // Clé stable des rappels en attente : l'effet ne repart que quand ils changent.
  const pendingKey = value.actions
    .filter((a) => a.alarmAt && !a.alarmFired)
    .map((a) => `${a.id}@${a.alarmAt}`)
    .join("|");

  useEffect(() => {
    if (!pendingKey) return;
    function scan() {
      const due = dueAlarms(latest.current);
      if (due.length === 0) return;
      due.forEach((action, i) => {
        const body = action.title.trim() || "Action sans titre";
        notify({ title: "Rappel action", body, kind: "alarm", durationMs: 12_000 });
        // Un seul son pour la salve de rappels.
        void fireAlarmNotification("yuri — suivi projet", body, { sound: i === 0 });
      });
      markRef.current(new Set(due.map((a) => a.id)));
    }
    scan();
    const id = window.setInterval(scan, ALARM_TICK_MS);
    return () => window.clearInterval(id);
  }, [pendingKey]);
}
