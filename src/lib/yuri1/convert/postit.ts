/** Post-it yuri 1 → yuri2 (même forme ; on valide juste la date d'alarme). */
import { defaultState, type PostItState } from "@/components/groups/postit/state";
import type { Converter } from "../types";
import { isObj, optStr, str } from "./util";

export const convertPostIt: Converter<PostItState> = (raw) => {
  if (!isObj(raw)) return defaultState();
  const state: PostItState = { text: str(raw.text) };
  const alarmAt = optStr(raw.alarmAt);
  if (alarmAt && !Number.isNaN(Date.parse(alarmAt))) {
    state.alarmAt = alarmAt;
    if (typeof raw.alarmFired === "boolean") state.alarmFired = raw.alarmFired;
  }
  return state;
};
