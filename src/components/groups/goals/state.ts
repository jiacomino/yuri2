import { genId } from "@/lib/id";

export type GoalStep = { id: string; label: string; done: boolean };

/**
 * Objectif mesuré soit par des étapes à cocher (`steps`), soit par une valeur chiffrée
 * à atteindre (`value` : `current` / `target` `unit`).
 */
export type Goal = {
  id: string;
  title: string;
  kind: "steps" | "value";
  steps: GoalStep[];
  current: number;
  target: number;
  unit: string;
  /** Échéance AAAA-MM-JJ, vide si aucune. */
  due: string;
};

export type GoalsState = { goals: Goal[] };

export function defaultState(): GoalsState {
  return { goals: [] };
}

export function demoState(): GoalsState {
  const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
  return {
    goals: [
      {
        id: "g1",
        title: "Lancer la nouvelle version du site",
        kind: "steps",
        steps: [
          { id: "s1", label: "Maquettes validées", done: true },
          { id: "s2", label: "Intégration des pages", done: true },
          { id: "s3", label: "Recette client", done: false },
          { id: "s4", label: "Mise en ligne", done: false },
        ],
        current: 0,
        target: 0,
        unit: "",
        due: inDays(18),
      },
      {
        id: "g2",
        title: "Lire 20 livres cette année",
        kind: "value",
        steps: [],
        current: 13,
        target: 20,
        unit: "livres",
        due: "",
      },
      {
        id: "g3",
        title: "Épargne vacances",
        kind: "value",
        steps: [],
        current: 1150,
        target: 1500,
        unit: "€",
        due: inDays(45),
      },
    ],
  };
}

export function newGoal(title: string, kind: Goal["kind"]): Goal {
  return {
    id: genId(),
    title: title.trim(),
    kind,
    steps: [],
    current: 0,
    target: kind === "value" ? 10 : 0,
    unit: "",
    due: "",
  };
}

/** Avancement de 0 à 1. */
export function progress(goal: Goal): number {
  if (goal.kind === "steps") {
    return goal.steps.length === 0 ? 0 : goal.steps.filter((s) => s.done).length / goal.steps.length;
  }
  return goal.target > 0 ? Math.min(1, Math.max(0, goal.current / goal.target)) : 0;
}

/** Jours restants avant l'échéance (négatif = dépassée), ou null sans échéance. */
export function daysLeft(goal: Goal, now = Date.now()): number | null {
  if (!goal.due) return null;
  const due = new Date(`${goal.due}T00:00:00`).getTime();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Math.round((due - today.getTime()) / 86_400_000);
}
