/**
 * Google Agenda yuri 1 → yuri2. Forme des jetons identique (`accessToken`, `refreshToken`,
 * `expiresAt` en ms epoch) : ils sont repris tels quels. Ils ne servent que si le même
 * Client ID / Secret est ressaisi dans yuri2 (stockés dans le localStorage, propre à chaque app).
 * Le cache d'événements (absent en yuri 1) part vide et se remplit à la prochaine synchro.
 */
import type { Calendar, GoogleTokens } from "@/lib/google";
import {
  MAX_DAYS,
  MIN_DAYS,
  defaultGCalendarState,
  type GCalendarState,
} from "@/components/groups/gcalendar/state";
import type { Converter } from "../types";
import { arr, bool, isObj, num, optStr, str } from "./util";

function tokens(v: unknown): GoogleTokens | undefined {
  if (!isObj(v) || typeof v.accessToken !== "string" || typeof v.expiresAt !== "number") return undefined;
  const refreshToken = optStr(v.refreshToken);
  return { accessToken: v.accessToken, ...(refreshToken ? { refreshToken } : {}), expiresAt: num(v.expiresAt, 0) };
}

export const convertGCalendar: Converter<GCalendarState> = (raw) => {
  const state = defaultGCalendarState();
  if (!isObj(raw)) return state;

  const calendars: Calendar[] = arr(raw.calendars)
    .filter(isObj)
    .filter((c) => typeof c.id === "string" && typeof c.summary === "string")
    .map((c) => ({
      id: str(c.id),
      summary: str(c.summary),
      backgroundColor: optStr(c.backgroundColor) ?? "#9ca3af",
      primary: bool(c.primary),
    }));

  const t = tokens(raw.tokens);
  return {
    ...state,
    ...(t ? { tokens: t } : {}),
    daysAhead: Math.max(MIN_DAYS, Math.min(MAX_DAYS, Math.round(num(raw.daysAhead, state.daysAhead)))),
    selectedCalendarIds: arr(raw.selectedCalendarIds).filter((s): s is string => typeof s === "string"),
    calendars,
  };
};
