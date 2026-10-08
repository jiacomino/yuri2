/**
 * Calendrier yuri 1 → yuri2. Format identique (tâches, applications, vue) : on revalide
 * chaque champ comme le faisait yuri 1 et on détache les tâches d'une application disparue.
 */
import { APP_COLORS } from "@/components/groups/calendar/meta";
import type { AppTag, CalendarState, CalendarTask, CalendarView, Priority } from "@/components/groups/calendar/state";
import type { Converter } from "../types";
import { arr, bool, isObj, oneOf, optStr, str } from "./util";

const PRIORITIES: readonly Priority[] = ["urgent", "high", "normal", "low"];
const VIEWS: readonly CalendarView[] = ["timeGridWeek", "threeDay", "timeGridDay", "dayGridMonth"];

export const convertCalendar: Converter<CalendarState> = (raw) => {
  if (!isObj(raw)) return { events: [], view: "timeGridWeek", apps: [] };

  const apps: AppTag[] = arr(raw.apps)
    .filter(isObj)
    .filter((a) => typeof a.id === "string" && typeof a.name === "string")
    .map((a, i) => ({
      id: str(a.id),
      name: str(a.name),
      color: optStr(a.color) ?? APP_COLORS[i % APP_COLORS.length],
    }));
  const appIds = new Set(apps.map((a) => a.id));

  const events: CalendarTask[] = arr(raw.events)
    .filter(isObj)
    .filter((e) => typeof e.id === "string" && typeof e.start === "string")
    .map((e, i) => {
      const appId = optStr(e.appId);
      return {
        id: str(e.id),
        title: str(e.title),
        start: str(e.start),
        end: optStr(e.end) ?? str(e.start),
        allDay: bool(e.allDay),
        color: optStr(e.color) ?? APP_COLORS[i % APP_COLORS.length],
        priority: oneOf(e.priority, PRIORITIES, "normal"),
        ...(appId && appIds.has(appId) ? { appId } : {}),
        notes: str(e.notes),
      };
    });

  return { events, view: oneOf(raw.view, VIEWS, "timeGridWeek"), apps };
};
