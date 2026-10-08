/**
 * Pomo-tâches yuri 1 → yuri2. Tâches, estimations et tâche active conservées ;
 * le minuteur (non persisté en v1) démarre à l'arrêt.
 */
import { DEFAULT_ESTIMATE, defaultState, type PomoTask, type PomoTaskState } from "@/components/groups/pomotask/state";
import { idleTimer } from "@/components/groups/pomodoro/timer";
import type { Converter } from "../types";
import { arr, isObj, num, obj, optStr, str } from "./util";

function newId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export const convertPomoTask: Converter<PomoTaskState> = (raw) => {
  const r = obj(raw);
  if (!Array.isArray(r.tasks)) return defaultState();
  const tasks: PomoTask[] = arr(r.tasks)
    .filter(isObj)
    .filter((t) => typeof t.text === "string")
    .map((t) => {
      const est = num(t.estimateMin, DEFAULT_ESTIMATE);
      return {
        id: optStr(t.id) ?? newId(),
        text: str(t.text),
        estimateMin: est > 0 && est <= 240 ? Math.floor(est) : DEFAULT_ESTIMATE,
      };
    });
  const active = str(r.activeTaskId);
  return { tasks, activeTaskId: tasks.some((t) => t.id === active) ? active : null, timer: idleTimer() };
};
