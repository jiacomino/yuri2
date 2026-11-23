import { genId } from "@/lib/id";

export type StepStatus = "todo" | "running" | "done" | "failed" | "skipped";

/** Étape du déroulé d'une MEP, avec sa note de suivi. */
export type DeployStep = {
  id: string;
  title: string;
  /** Responsable de l'étape, vide si non attribuée. */
  owner: string;
  status: StepStatus;
  note: string;
  /** Instant (ms) du dernier changement de statut, null si jamais modifié. */
  statusAt: number | null;
};

/** Une mise en production d'une application. */
export type Deployment = {
  id: string;
  app: string;
  version: string;
  /** Date prévue AAAA-MM-JJ, vide si non fixée. */
  date: string;
  steps: DeployStep[];
};

export type DeployState = {
  deployments: Deployment[];
  /** MEP affichée, null s'il n'y en a aucune. */
  activeId: string | null;
};

/** Étapes proposées pour la première MEP d'une application. */
export const TEMPLATE_STEPS = [
  "Validation de la recette et go de MEP",
  "Information des utilisateurs",
  "Sauvegarde de la base de données",
  "Mise en maintenance de l'application",
  "Déploiement des livrables",
  "Exécution des scripts de migration",
  "Tests de bon fonctionnement",
  "Levée de la maintenance",
  "Communication de fin de MEP",
];

export function newStep(title: string): DeployStep {
  return { id: genId(), title: title.trim(), owner: "", status: "todo", note: "", statusAt: null };
}

/**
 * Nouvelle MEP : reprend les étapes (titres et responsables, sans statut ni note) de la
 * dernière MEP de la même application, ou le modèle standard à défaut.
 */
export function newDeployment(app: string, version: string, date: string, previous?: Deployment): Deployment {
  const steps = previous
    ? previous.steps.map((s) => ({ ...newStep(s.title), owner: s.owner }))
    : TEMPLATE_STEPS.map(newStep);
  return { id: genId(), app: app.trim(), version: version.trim(), date, steps };
}

/** Dernière MEP (par date) de l'application, comparée sans tenir compte de la casse. */
export function lastDeploymentOf(deployments: Deployment[], app: string): Deployment | undefined {
  const key = app.trim().toLowerCase();
  if (!key) return undefined;
  return sortByDate(deployments.filter((d) => d.app.trim().toLowerCase() === key))[0];
}

/** Plus récentes d'abord ; sans date en tête (MEP en préparation). */
export function sortByDate(deployments: Deployment[]): Deployment[] {
  return [...deployments].sort((a, b) => (b.date || "9999").localeCompare(a.date || "9999"));
}

export type DeployPhase = "planned" | "running" | "done" | "failed";

/** État global de la MEP, déduit de ses étapes. */
export function deployPhase(d: Deployment): DeployPhase {
  if (d.steps.some((s) => s.status === "failed")) return "failed";
  if (d.steps.length > 0 && d.steps.every((s) => s.status === "done" || s.status === "skipped")) return "done";
  if (d.steps.some((s) => s.status !== "todo")) return "running";
  return "planned";
}

/** Étapes closes (terminées ou ignorées) sur le total. */
export function closedCount(d: Deployment): number {
  return d.steps.filter((s) => s.status === "done" || s.status === "skipped").length;
}

export function formatDate(date: string): string {
  return date ? new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR") : "Date à fixer";
}

export function defaultState(): DeployState {
  return { deployments: [], activeId: null };
}

export function demoState(): DeployState {
  const today = new Date().toISOString().slice(0, 10);
  const at = (h: number, m: number) => new Date().setHours(h, m, 0, 0);
  const d = newDeployment("Portail client", "3.4.0", today);
  const statuses: StepStatus[] = ["done", "done", "done", "done", "running"];
  d.steps = d.steps.map((s, i) => ({
    ...s,
    status: statuses[i] ?? "todo",
    statusAt: statuses[i] ? at(20, i * 7) : null,
    owner: i < 3 ? "Chef de projet" : "Exploitation",
  }));
  d.steps[2].note = "Dump complet : portail_20h14.sql (2,3 Go), vérifié.";
  d.steps[4].note = "Livrable v3.4.0 copié sur les 2 serveurs, redémarrage du nœud 2 en cours.";
  return { deployments: [d], activeId: d.id };
}
