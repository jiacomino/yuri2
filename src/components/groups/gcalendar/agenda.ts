import type { CalendarEvent } from "@/lib/google";

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Jour local (AAAA-MM-JJ) d'un événement. */
function eventDayKey(ev: CalendarEvent): string {
  return ev.allDay ? ev.start : dateKey(new Date(ev.start));
}

/** « Aujourd'hui · mar. 28 mai », « Demain · mer. 29 mai », sinon « jeu. 30 mai ». */
export function formatDayHeader(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (key === dateKey(today)) return `Aujourd'hui · ${date}`;
  if (key === dateKey(tomorrow)) return `Demain · ${date}`;
  return date;
}

/** « 10:30 – 11:00 » pour un événement horaire, « Toute la journée » sinon. */
export function formatEventTime(ev: CalendarEvent): string {
  if (ev.allDay) return "Toute la journée";
  const fmt = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return ev.end ? `${fmt(ev.start)} – ${fmt(ev.end)}` : fmt(ev.start);
}

/** Événement horaire en cours à l'instant `now`. */
export function isOngoing(ev: CalendarEvent, now: number): boolean {
  if (ev.allDay || !ev.end) return false;
  return new Date(ev.start).getTime() <= now && now < new Date(ev.end).getTime();
}

export type DayGroup = { key: string; events: CalendarEvent[] };

/** Événement terminé (le cache peut en contenir entre deux synchronisations). */
function isPast(ev: CalendarEvent, now: Date): boolean {
  if (!ev.end) return false;
  // Fin exclusive « AAAA-MM-JJ » pour une journée entière.
  return ev.allDay ? ev.end <= dateKey(now) : new Date(ev.end).getTime() <= now.getTime();
}

/**
 * Regroupe par jour local, avec toujours une section « aujourd'hui » en tête. Les
 * événements commencés avant aujourd'hui et toujours en cours sont rangés aujourd'hui.
 */
export function groupByDay(events: CalendarEvent[]): DayGroup[] {
  const now = new Date();
  const today = dateKey(now);
  const buckets = new Map<string, CalendarEvent[]>([[today, []]]);
  for (const ev of events) {
    if (isPast(ev, now)) continue;
    const day = eventDayKey(ev);
    const key = day < today ? today : day;
    const list = buckets.get(key);
    if (list) list.push(ev);
    else buckets.set(key, [ev]);
  }
  return [...buckets.entries()]
    .map(([key, evs]) => ({ key, events: evs }))
    .sort((a, b) => a.key.localeCompare(b.key));
}
