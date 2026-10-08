/** Priorité d'une tâche ; absente = aucune priorité. */
export type TodoPriority = "urgent" | "high" | "normal" | "low";

export type TodoSubtask = {
  id: string;
  text: string;
  done: boolean;
};

export type TodoItem = {
  id: string;
  text: string;
  done: boolean;
  priority?: TodoPriority;
  subtasks?: TodoSubtask[];
  /** Date ISO à laquelle l'alarme doit sonner. */
  alarmAt?: string;
  /** Vrai une fois l'alarme déclenchée pour cette valeur de `alarmAt`. */
  alarmFired?: boolean;
};

export type TodoTab = {
  id: string;
  name: string;
  items: TodoItem[];
};

export type TodoState = {
  tabs: TodoTab[];
  activeTabId: string;
};

export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

export function defaultTodoState(): TodoState {
  const id = newId();
  return { tabs: [{ id, name: "Tâches", items: [] }], activeTabId: id };
}

function inHours(h: number): string {
  return new Date(Date.now() + h * 3_600_000).toISOString();
}

export function demoTodoState(): TodoState {
  const pro = newId();
  const perso = newId();
  const courses = newId();
  const task = (text: string, extra: Partial<TodoItem> = {}): TodoItem => ({
    id: newId(),
    text,
    done: false,
    ...extra,
  });
  const sub = (text: string, done = false): TodoSubtask => ({ id: newId(), text, done });
  return {
    activeTabId: pro,
    tabs: [
      {
        id: pro,
        name: "Travail",
        items: [
          task("Finaliser la présentation du bilan T3", {
            priority: "urgent",
            alarmAt: inHours(2),
            subtasks: [
              sub("Mettre à jour les graphiques de ventes", true),
              sub("Relire les slides avec Claire"),
              sub("Exporter en PDF"),
            ],
          }),
          task("Répondre au mail du fournisseur Lumen", { priority: "high" }),
          task("Préparer l'entretien annuel de Julien", { priority: "normal", alarmAt: inHours(26) }),
          task("Réserver la salle pour l'atelier produit", { done: true }),
          task("Mettre à jour la documentation de l'API", { priority: "low" }),
        ],
      },
      {
        id: perso,
        name: "Perso",
        items: [
          task("Prendre rendez-vous chez le dentiste", { priority: "high" }),
          task("Renouveler le passeport"),
          task("Appeler mamie dimanche", { done: true }),
        ],
      },
      {
        id: courses,
        name: "Courses",
        items: [
          task("Pain de campagne"),
          task("Fromage de chèvre", { done: true }),
          task("Tomates, courgettes, basilic"),
        ],
      },
    ],
  };
}
