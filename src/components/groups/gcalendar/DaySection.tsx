import type { CalendarEvent } from "@/lib/google";
import { cn } from "@/lib/utils";
import { formatDayHeader, isOngoing } from "./agenda";
import { EventRow } from "./EventRow";

const FALLBACK_COLOR = "#9ca3af";

type DaySectionProps = {
  dayKey: string;
  isToday: boolean;
  events: CalendarEvent[];
  colorOf: (calendarId: string) => string | undefined;
  now: number;
};

/** Une journée de l'agenda, avec un en-tête collant. */
export function DaySection({ dayKey, isToday, events, colorOf, now }: DaySectionProps) {
  return (
    <section className="flex flex-col gap-0.5">
      <h4
        className={cn(
          "sticky top-0 z-10 bg-surface px-2.5 py-1.5 text-[0.8148rem] font-bold tracking-[.06em] uppercase",
          isToday ? "text-accent" : "text-muted",
        )}
      >
        {formatDayHeader(dayKey)}
      </h4>
      {events.length === 0 ? (
        <p className="px-2.5 py-1.5 text-[0.8889rem] text-muted">Aucun événement</p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {events.map((ev) => (
            <EventRow
              key={`${ev.calendarId}:${ev.id}`}
              event={ev}
              color={colorOf(ev.calendarId) ?? FALLBACK_COLOR}
              ongoing={isOngoing(ev, now)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
