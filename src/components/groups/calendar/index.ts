import { CalendarRange } from "lucide-react";
import type { GroupDefinition } from "../types";
import { CalendarBody } from "./CalendarBody";
import { defaultCalendarState, demoCalendarState, type CalendarState } from "./state";

export const calendarGroup: GroupDefinition<CalendarState> = {
  kind: "calendar",
  label: "Calendrier",
  icon: CalendarRange,
  color: "#4f7cff",
  defaultState: defaultCalendarState,
  demoState: demoCalendarState,
  Body: CalendarBody,
  preview: { cols: 2, height: 620 },
};

export type { AppTag, CalendarState, CalendarTask, CalendarView, Priority } from "./state";
