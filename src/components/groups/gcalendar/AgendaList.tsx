import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import type { Calendar, CalendarEvent } from "@/lib/google";
import { dateKey, groupByDay } from "./agenda";
import { DaySection } from "./DaySection";

type AgendaListProps = {
  events: CalendarEvent[];
  calendars: Calendar[];
  hasSelection: boolean;
};

/** Événements à venir, regroupés par jour. */
export function AgendaList({ events, calendars, hasSelection }: AgendaListProps) {
  const groups = useMemo(() => groupByDay(events), [events]);
  const colors = useMemo(() => new Map(calendars.map((c) => [c.id, c.backgroundColor])), [calendars]);
  const today = dateKey(new Date());
  const now = Date.now();

  if (!hasSelection) {
    return (
      <p className="px-2 py-6 text-center text-[0.8889rem] text-muted">
        Aucun calendrier sélectionné. Choisissez-en avec l'icône <CalendarDays className="mb-0.5 inline size-3.5" /> en
        bas.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map((g) => (
        <DaySection
          key={g.key}
          dayKey={g.key}
          isToday={g.key === today}
          events={g.events}
          colorOf={(id) => colors.get(id)}
          now={now}
        />
      ))}
    </div>
  );
}
