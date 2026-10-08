/**
 * Eisenhower yuri 1 → yuri2. Même structure (4 quadrants, fait, alarmes) ;
 * les quadrants absents sont créés vides.
 */
import {
  defaultState,
  QUADRANT_IDS,
  type EisenhowerState,
  type EisenhowerTask,
} from "@/components/groups/eisenhower/state";
import type { Converter } from "../types";
import { arr, isObj, obj, optStr, str } from "./util";

function newId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export const convertEisenhower: Converter<EisenhowerState> = (raw) => {
  const r = obj(raw);
  const src = obj(r.tasks);
  const state = defaultState();
  for (const q of QUADRANT_IDS) {
    state.tasks[q] = arr(src[q])
      .filter(isObj)
      .filter((t) => typeof t.text === "string")
      .map((t) => {
        const task: EisenhowerTask = { id: optStr(t.id) ?? newId(), text: str(t.text) };
        if (typeof t.done === "boolean") task.done = t.done;
        const alarmAt = optStr(t.alarmAt);
        if (alarmAt && !Number.isNaN(new Date(alarmAt).getTime())) {
          task.alarmAt = alarmAt;
          if (typeof t.alarmFired === "boolean") task.alarmFired = t.alarmFired;
        }
        return task;
      });
  }
  return state;
};
