import type { CalendarView, Priority } from "./state";

/** Couleurs proposées aux applications et aux tâches, dans l'ordre. */
export const APP_COLORS = ["#4f7cff", "#a855f7", "#10b981", "#f59e0b", "#ec4899", "#06b6d4", "#ef4444", "#64748b"];

export function nextColor(count: number): string {
  return APP_COLORS[count % APP_COLORS.length];
}

export const PRIORITY_ORDER: Priority[] = ["urgent", "high", "normal", "low"];

export const PRIORITY_META: Record<Priority, { label: string; text: string; hex: string }> = {
  urgent: { label: "Urgent", text: "text-red-500", hex: "#ef4444" },
  high: { label: "Important", text: "text-orange-500", hex: "#f97316" },
  normal: { label: "Normal", text: "text-blue-500", hex: "#3b82f6" },
  low: { label: "Basse", text: "text-slate-400", hex: "#94a3b8" },
};

export function isUrgent(p: Priority): boolean {
  return p === "urgent" || p === "high";
}

export const VIEWS: { id: CalendarView; label: string }[] = [
  { id: "dayGridMonth", label: "Mois" },
  { id: "timeGridWeek", label: "Semaine" },
  { id: "threeDay", label: "3 jours" },
  { id: "timeGridDay", label: "Jour" },
];

export function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}
