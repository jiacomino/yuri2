export type CardPriority = "urgent" | "important" | "normal" | "low";

/** Application (projet / produit) à laquelle une carte peut être affectée. */
export type AppTag = {
  id: string;
  name: string;
  /** Couleur hex de la vignette. */
  color: string;
};

export type KanbanCard = {
  id: string;
  title: string;
  description?: string;
  /** Absente = « normal ». */
  priority?: CardPriority;
  /** Id d'une entrée de `KanbanState.apps`, absent si non affectée. */
  appId?: string;
};

export type KanbanColumn = {
  id: string;
  name: string;
  cards: KanbanCard[];
};

export type KanbanState = {
  columns: KanbanColumn[];
  apps: AppTag[];
};

/** Champs modifiables d'une carte. */
export type CardPatch = Partial<Pick<KanbanCard, "title" | "description" | "priority" | "appId">>;

export const DEFAULT_COLUMN_NAMES = ["Backlog", "À faire", "En cours", "Terminé"];

export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

export function defaultKanbanState(): KanbanState {
  return {
    columns: DEFAULT_COLUMN_NAMES.map((name) => ({ id: newId(), name, cards: [] })),
    apps: [],
  };
}

export function demoKanbanState(): KanbanState {
  const site = { id: newId(), name: "Site web", color: "#4f7cff" };
  const mobile = { id: newId(), name: "App mobile", color: "#a855f7" };
  const crm = { id: newId(), name: "CRM", color: "#10b981" };
  const card = (title: string, extra: Partial<KanbanCard> = {}): KanbanCard => ({ id: newId(), title, ...extra });
  return {
    apps: [site, mobile, crm],
    columns: [
      {
        id: newId(),
        name: "Backlog",
        cards: [
          card("Refonte de la page tarifs", { appId: site.id, priority: "low" }),
          card("Mode hors ligne", {
            appId: mobile.id,
            description: "Mettre en cache les dernières commandes consultées.",
          }),
          card("Export CSV des contacts", { appId: crm.id }),
        ],
      },
      {
        id: newId(),
        name: "À faire",
        cards: [
          card("Corriger le bug de connexion Google", { appId: mobile.id, priority: "urgent" }),
          card("Rédiger l'article de blog de lancement", {
            appId: site.id,
            description: "800 mots, avec captures d'écran de la nouvelle interface.",
          }),
        ],
      },
      {
        id: newId(),
        name: "En cours",
        cards: [
          card("Tableau de bord des ventes", {
            appId: crm.id,
            priority: "important",
            description: "Graphiques mensuels + filtres par commercial.",
          }),
          card("Optimiser les images du site", { appId: site.id }),
        ],
      },
      {
        id: newId(),
        name: "Terminé",
        cards: [
          card("Nouveau logo dans l'en-tête", { appId: site.id }),
          card("Notifications push iOS", { appId: mobile.id }),
        ],
      },
    ],
  };
}
