import { CalendarClock } from "lucide-react";
import type { GroupDefinition } from "../types";
import { GCalendarBody } from "./GCalendarBody";
import { defaultGCalendarState, demoGCalendarState, type GCalendarState } from "./state";

export const gcalendarGroup: GroupDefinition<GCalendarState> = {
  kind: "gcalendar",
  label: "Google Agenda",
  icon: CalendarClock,
  color: "#4285f4",
  defaultState: defaultGCalendarState,
  demoState: demoGCalendarState,
  Body: GCalendarBody,
  preview: { cols: 1, height: 520 },
};

export type { GCalendarState } from "./state";
