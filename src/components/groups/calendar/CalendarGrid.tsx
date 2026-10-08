import { useMemo, type RefObject } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import frLocale from "@fullcalendar/core/locales/fr";
import type { DateSelectArg, EventApi, EventInput } from "@fullcalendar/core";
import { EventContent } from "./EventContent";
import { isUrgent, PRIORITY_META } from "./meta";
import type { AppTag, CalendarTask, CalendarView } from "./state";

type CalendarGridProps = {
  calRef: RefObject<FullCalendar | null>;
  initialView: CalendarView;
  tasks: CalendarTask[];
  apps: AppTag[];
  selectedId: string | null;
  onSelectRange: (start: string, end: string, allDay: boolean) => void;
  onTaskClick: (id: string) => void;
  onTaskMove: (id: string, patch: Pick<CalendarTask, "start" | "end" | "allDay">) => void;
  onTitleChange: (title: string) => void;
};

function boundsOf(event: EventApi): Pick<CalendarTask, "start" | "end" | "allDay"> {
  const start = event.start ?? new Date();
  const end = event.end ?? new Date(start.getTime() + (event.allDay ? 24 * 60 : 30) * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString(), allDay: event.allDay };
}

/** Grille FullCalendar (français, semaine du lundi), habillée par `calendar.css`. */
export function CalendarGrid({
  calRef,
  initialView,
  tasks,
  apps,
  selectedId,
  onSelectRange,
  onTaskClick,
  onTaskMove,
  onTitleChange,
}: CalendarGridProps) {
  const appsById = useMemo(() => new Map(apps.map((a) => [a.id, a])), [apps]);
  const tasksById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  // Tableau mémoïsé : FullCalendar ne redessine pas la grille aux changements sans rapport.
  const events: EventInput[] = useMemo(
    () =>
      tasks.map((t) => {
        // L'application impose la teinte ; l'urgence colore la bordure.
        const tint = (t.appId && appsById.get(t.appId)?.color) || t.color;
        return {
          id: t.id,
          title: t.title || "(sans titre)",
          start: t.start,
          end: t.end,
          allDay: t.allDay,
          backgroundColor: `${tint}26`,
          borderColor: isUrgent(t.priority) ? PRIORITY_META[t.priority].hex : `${tint}80`,
          textColor: tint,
        };
      }),
    [tasks, appsById],
  );

  return (
    <FullCalendar
      ref={calRef}
      plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
      initialView={initialView}
      views={{ threeDay: { type: "timeGrid", duration: { days: 3 } } }}
      locale={frLocale}
      firstDay={1}
      headerToolbar={false}
      height="100%"
      expandRows
      nowIndicator
      allDaySlot
      allDayText="Jour"
      slotDuration="00:30:00"
      scrollTime="08:00:00"
      slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
      editable
      selectable
      selectMirror
      eventResizableFromStart
      dayMaxEvents
      events={events}
      eventClassNames={(arg) => {
        const task = tasksById.get(arg.event.id);
        const classes = [`cal-prio-${task?.priority ?? "normal"}`];
        if (arg.event.id === selectedId) classes.push("cal-event-selected");
        return classes;
      }}
      eventContent={(arg) => {
        const task = tasksById.get(arg.event.id);
        return (
          <EventContent
            task={task}
            app={task?.appId ? appsById.get(task.appId) : undefined}
            title={arg.event.title}
            timeText={arg.timeText}
          />
        );
      }}
      select={(arg: DateSelectArg) => {
        onSelectRange(arg.start.toISOString(), arg.end.toISOString(), arg.allDay);
        arg.view.calendar.unselect();
      }}
      eventClick={(arg) => onTaskClick(arg.event.id)}
      eventDrop={(arg) => onTaskMove(arg.event.id, boundsOf(arg.event))}
      eventResize={(arg) => onTaskMove(arg.event.id, boundsOf(arg.event))}
      datesSet={(arg) => onTitleChange(arg.view.title)}
    />
  );
}
