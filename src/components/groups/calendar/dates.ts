const pad = (n: number) => String(n).padStart(2, "0");

/** Valeur d'un `<input type="datetime-local">` pour une date ISO, en heure locale. */
export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Valeur d'un `<input type="date">` pour une date ISO, en heure locale. */
export function toDateInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromInput(value: string): string | null {
  if (!value) return null;
  // « AAAA-MM-JJ » seul serait lu en UTC : on force minuit local.
  const d = new Date(value.includes("T") ? value : `${value}T00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** Prochaine demi-heure : créneau par défaut d'une tâche créée avec « + ». */
export function nextSlot(): { start: string; end: string } {
  const start = new Date();
  start.setSeconds(0, 0);
  start.setMinutes(start.getMinutes() >= 30 ? 60 : 30);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Bornes d'une tâche passée en journée entière (minuit → minuit suivant) ou en horaire (9 h → 10 h). */
export function allDayBounds(startIso: string, allDay: boolean): { start: string; end: string } {
  const start = new Date(startIso);
  if (allDay) {
    start.setHours(0, 0, 0, 0);
    return { start: start.toISOString(), end: new Date(start.getTime() + DAY_MS).toISOString() };
  }
  start.setHours(9, 0, 0, 0);
  return { start: start.toISOString(), end: new Date(start.getTime() + 60 * 60 * 1000).toISOString() };
}
