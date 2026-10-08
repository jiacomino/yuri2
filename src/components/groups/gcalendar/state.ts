import type { Calendar, CalendarEvent, GoogleTokens } from "@/lib/google";

export type GCalendarState = {
  tokens?: GoogleTokens;
  /** Fenêtre d'affichage, en jours (1 à 90). */
  daysAhead: number;
  /** Calendriers affichés ; vide jusqu'à la première connexion. */
  selectedCalendarIds: string[];
  /** Liste des calendriers mise en cache, rafraîchie à chaque synchronisation. */
  calendars: Calendar[];
  /** Derniers événements récupérés : affichés tout de suite à l'ouverture. */
  events: CalendarEvent[];
  /** Instant (epoch ms) de la dernière synchronisation réussie. */
  syncedAt?: number;
  /** Mode démonstration (galerie) : aucun appel réseau, données fictives. */
  demo?: boolean;
};

export const MIN_DAYS = 1;
export const MAX_DAYS = 90;

export function defaultGCalendarState(): GCalendarState {
  return { daysAhead: 7, selectedCalendarIds: [], calendars: [], events: [] };
}

export function demoGCalendarState(): GCalendarState {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  const at = (day: number, h: number, m = 0) => {
    const d = new Date(base);
    d.setDate(d.getDate() + day);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };
  const date = (day: number) => {
    const d = new Date(base);
    d.setDate(d.getDate() + day);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const calendars: Calendar[] = [
    { id: "perso", summary: "Camille Martin", backgroundColor: "#4285f4", primary: true },
    { id: "travail", summary: "Travail", backgroundColor: "#0b8043", primary: false },
    { id: "famille", summary: "Famille", backgroundColor: "#f4511e", primary: false },
    { id: "feries", summary: "Jours fériés en France", backgroundColor: "#9e69af", primary: false },
  ];

  const ev = (
    id: string,
    calendarId: string,
    summary: string,
    start: string,
    end: string,
    extra: Partial<CalendarEvent> = {},
  ): CalendarEvent => ({ id, calendarId, summary, start, end, allDay: false, htmlLink: "https://calendar.google.com", ...extra });

  return {
    demo: true,
    daysAhead: 7,
    calendars,
    selectedCalendarIds: ["perso", "travail", "famille"],
    syncedAt: Date.now() - 3 * 60 * 1000,
    events: [
      ev("e1", "travail", "Stand-up produit", at(0, 9, 30), at(0, 9, 45), { videoLink: "https://meet.google.com" }),
      ev("e2", "travail", "Revue de sprint", at(0, 14), at(0, 15), { location: "Salle Montmartre, 3ᵉ étage" }),
      ev("e3", "perso", "Yoga", at(0, 18, 30), at(0, 19, 30), { location: "Studio Prana, 12 rue des Lilas" }),
      ev("e4", "famille", "Anniversaire de Léa 🎂", date(1), date(2), { allDay: true }),
      ev("e5", "travail", "Entretien candidat — dev front", at(1, 11), at(1, 12), { videoLink: "https://meet.google.com" }),
      ev("e6", "perso", "Dentiste", at(2, 8, 45), at(2, 9, 30), { location: "Cabinet Dr Lefèvre" }),
      ev("e7", "travail", "Comité de pilotage", at(3, 10), at(3, 11, 30)),
      ev("e8", "famille", "Dîner chez les parents", at(4, 19, 30), at(4, 22)),
    ],
  };
}
