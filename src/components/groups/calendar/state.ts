/** Même échelle que le suivi de projet. */
export type Priority = "urgent" | "high" | "normal" | "low";

/** Vues FullCalendar ; « threeDay » est une grille horaire personnalisée de 3 jours. */
export type CalendarView = "timeGridWeek" | "threeDay" | "timeGridDay" | "dayGridMonth";

/** Application (projet / produit) à laquelle une tâche peut être rattachée. */
export type AppTag = {
  id: string;
  name: string;
  color: string;
};

export type CalendarTask = {
  id: string;
  title: string;
  /** Date-heure ISO. */
  start: string;
  /** Date-heure ISO ; pour une journée entière, fin exclusive. */
  end: string;
  allDay: boolean;
  /** Teinte de secours quand la tâche n'a pas d'application. */
  color: string;
  priority: Priority;
  /** Id d'une entrée de `apps`, absent si non affectée. */
  appId?: string;
  notes: string;
};

/**
 * État du calendrier. Forme compatible avec `@/lib/calendarLink`, qui ajoute des
 * tâches depuis d'autres composants.
 */
export type CalendarState = {
  events: CalendarTask[];
  view: CalendarView;
  apps: AppTag[];
};

export function defaultCalendarState(): CalendarState {
  return { events: [], view: "timeGridWeek", apps: [] };
}

/** Démo : une semaine de travail réaliste, calée sur la semaine en cours. */
export function demoCalendarState(): CalendarState {
  const monday = new Date();
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));

  const at = (day: number, h: number, m = 0) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + day);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  const apps: AppTag[] = [
    { id: "app-site", name: "Site vitrine", color: "#4f7cff" },
    { id: "app-mobile", name: "App mobile", color: "#a855f7" },
    { id: "app-interne", name: "Interne", color: "#10b981" },
  ];

  let n = 0;
  const task = (
    title: string,
    start: string,
    end: string,
    extra: Partial<CalendarTask> = {},
  ): CalendarTask => ({
    id: `demo-${++n}`,
    title,
    start,
    end,
    allDay: false,
    color: "#64748b",
    priority: "normal",
    notes: "",
    ...extra,
  });

  return {
    view: "timeGridWeek",
    apps,
    events: [
      task("Point d'équipe", at(0, 9, 30), at(0, 10), { appId: "app-interne" }),
      task("Maquettes page tarifs", at(0, 14), at(0, 16, 30), { appId: "app-site" }),
      task("Revue de code PR #142", at(1, 10), at(1, 11, 30), {
        appId: "app-mobile",
        priority: "urgent",
        notes: "Vérifier la gestion hors ligne avant la mise en production.",
      }),
      task("Atelier UX — parcours d'inscription", at(2, 9), at(2, 11), { appId: "app-mobile" }),
      task("Déjeuner client Durand & Fils", at(2, 12, 30), at(2, 14), { color: "#f59e0b" }),
      task("Déploiement v2.3", at(3, 16), at(3, 17), { appId: "app-site", priority: "high" }),
      task("Rédiger la doc de l'API", at(4, 9), at(4, 11, 30), { appId: "app-interne", priority: "low" }),
      task("Rétrospective du sprint", at(4, 15), at(4, 16), { appId: "app-interne" }),
      task("Salon du numérique — Lyon", at(3, 0), at(5, 0), { allDay: true, color: "#ec4899" }),
    ],
  };
}
