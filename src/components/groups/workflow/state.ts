/**
 * État du groupe « Workflow » : étapes ordonnées, actions qui les traversent et
 * applications (projets / produits) auxquelles on affecte les actions.
 *
 * Tout est sérialisable en JSON. Les helpers ci-dessous sont purs : ils prennent
 * un état et renvoient le suivant, sans effet de bord.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type Priority = "urgent" | "high" | "normal" | "low";

export type ActionStatus = "todo" | "doing" | "done";

export type ChecklistItem = { id: string; label: string; done: boolean };

export type WorkflowStep = {
  id: string;
  name: string;
  /**
   * Critères pour quitter l'étape. Copiés sur chaque action qui y entre :
   * chaque action porte ainsi sa propre liste cochable.
   */
  exitCriteria: string[];
  /** Teinte hexadécimale ; absente = couleur par défaut de la position. */
  color?: string;
};

/** Application (projet / produit) à laquelle une action peut être affectée. */
export type AppTag = { id: string; name: string; color: string };

export type WorkflowAction = {
  id: string;
  title: string;
  notes: string;
  stepId: string;
  status: ActionStatus;
  priority: Priority;
  owner: string;
  /** Date ISO (AAAA-MM-JJ) ; vide quand il n'y a pas d'échéance. */
  due: string;
  /** Actions qui doivent être terminées avant que celle-ci puisse avancer. */
  dependsOn: string[];
  /** Critères de sortie de l'étape courante, plus ceux ajoutés à la main. */
  checklist: ChecklistItem[];
  /** Date ISO d'entrée dans l'étape courante — sert au badge d'ancienneté. */
  enteredAt: string;
  /** Id d'une entrée de `WorkflowState.apps`, absent si non affectée. */
  appId?: string;
  /** Date ISO à laquelle le rappel doit sonner. */
  alarmAt?: string;
  /** Vrai une fois le rappel sonné pour cette valeur de `alarmAt`. */
  alarmFired?: boolean;
};

export type WorkflowState = {
  steps: WorkflowStep[];
  actions: WorkflowAction[];
  apps: AppTag[];
};

// ─── Constantes ─────────────────────────────────────────────────────────────

/** Jours passés dans la même étape au-delà desquels une action « stagne ». */
export const STALE_DAYS = 5;
/** Nombre d'actions prêtes listées dans le bandeau « Prochaines actions ». */
export const READY_LIMIT = 4;

export const DEFAULT_STEP_NAMES = ["Backlog", "À faire", "En cours", "Terminé"];

/** Teintes par défaut des étapes, dans l'ordre. La dernière étape est toujours verte. */
export const STEP_COLORS = ["#64748b", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4", "#ef4444"];
export const DONE_STEP_COLOR = "#10b981";

/** Couleurs proposées aux nouvelles applications, dans l'ordre. */
export const APP_COLORS = ["#4f7cff", "#a855f7", "#10b981", "#f59e0b", "#ec4899", "#06b6d4", "#ef4444", "#64748b"];

/** De la plus urgente à la moins urgente — aussi l'ordre de la file des actions prêtes. */
export const PRIORITY_ORDER: Priority[] = ["urgent", "high", "normal", "low"];

// ─── Utilitaires ────────────────────────────────────────────────────────────

export function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function daysSince(iso: string): number {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return 0;
  return Math.max(0, Math.floor((Date.now() - then) / 86_400_000));
}

/** « 2025-03-14 » → « 14/03 ». */
export function formatDue(due: string): string {
  const [y, m, d] = due.split("-");
  return y && m && d ? `${d}/${m}` : due;
}

export function nextAppColor(count: number): string {
  return APP_COLORS[count % APP_COLORS.length];
}

/** Teinte d'une étape : la sienne, sinon celle de sa position dans la palette. */
export function stepColor(steps: WorkflowStep[], step: WorkflowStep): string {
  if (step.color) return step.color;
  const index = steps.findIndex((s) => s.id === step.id);
  if (index === steps.length - 1) return DONE_STEP_COLOR;
  return STEP_COLORS[Math.max(0, index) % STEP_COLORS.length];
}

/** Copie cochable et neuve des critères de sortie d'une étape. */
export function checklistFor(step: WorkflowStep | undefined): ChecklistItem[] {
  if (!step) return [];
  return step.exitCriteria.map((label) => ({ id: genId(), label, done: false }));
}

/** Vrai quand `fromId` dépend déjà (transitivement) de `targetId`. */
export function dependsTransitively(actions: WorkflowAction[], fromId: string, targetId: string): boolean {
  const index = new Map(actions.map((a) => [a.id, a]));
  const seen = new Set<string>();
  const stack = [fromId];
  while (stack.length > 0) {
    const id = stack.pop() as string;
    if (id === targetId) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    const a = index.get(id);
    if (a) stack.push(...a.dependsOn);
  }
  return false;
}

// ─── Sélecteurs ─────────────────────────────────────────────────────────────

export function lastStepId(state: WorkflowState): string {
  return state.steps[state.steps.length - 1]?.id ?? "";
}

/** Prérequis non terminés d'une action (vide si l'action est terminée). */
export function blockersOf(byId: Map<string, WorkflowAction>, action: WorkflowAction): WorkflowAction[] {
  if (action.status === "done") return [];
  return action.dependsOn
    .map((id) => byId.get(id))
    .filter((a): a is WorkflowAction => !!a && a.status !== "done");
}

/** Non terminées et sans prérequis en attente, triées priorité → échéance → ancienneté. */
export function readyQueue(actions: WorkflowAction[], byId: Map<string, WorkflowAction>): WorkflowAction[] {
  const rank = (p: Priority) => PRIORITY_ORDER.indexOf(p);
  return actions
    .filter((a) => a.status !== "done" && blockersOf(byId, a).length === 0)
    .sort((a, b) => {
      if (a.priority !== b.priority) return rank(a.priority) - rank(b.priority);
      const dueA = a.due || "9999-99-99";
      const dueB = b.due || "9999-99-99";
      if (dueA !== dueB) return dueA.localeCompare(dueB);
      return a.enteredAt.localeCompare(b.enteredAt);
    });
}

// ─── Actions ────────────────────────────────────────────────────────────────

function mapAction(state: WorkflowState, id: string, fn: (a: WorkflowAction) => WorkflowAction): WorkflowState {
  return { ...state, actions: state.actions.map((a) => (a.id === id ? fn(a) : a)) };
}

export function patchAction(state: WorkflowState, id: string, patch: Partial<WorkflowAction>): WorkflowState {
  return mapAction(state, id, (a) => ({ ...a, ...patch }));
}

/** L'action telle qu'elle est en entrant dans `step` : statut, date d'entrée et critères recalculés. */
function enterStep(state: WorkflowState, action: WorkflowAction, step: WorkflowStep): WorkflowAction {
  const isLast = lastStepId(state) === step.id;
  return {
    ...action,
    stepId: step.id,
    status: isLast ? "done" : action.status === "done" ? "todo" : action.status,
    enteredAt: new Date().toISOString(),
    // La liste de contrôle est la barrière de l'étape : on la reconstruit à l'entrée.
    checklist: checklistFor(step),
  };
}

export function addAction(state: WorkflowState, stepId: string, title: string, appId?: string): WorkflowState {
  const trimmed = title.trim();
  if (!trimmed || !state.steps.some((s) => s.id === stepId)) return state;
  const action: WorkflowAction = {
    id: genId(),
    title: trimmed,
    notes: "",
    stepId,
    status: stepId === lastStepId(state) ? "done" : "todo",
    priority: "normal",
    owner: "",
    due: "",
    dependsOn: [],
    // Une action neuve démarre sans critères : ils ne la rejoignent qu'en *entrant* dans une étape.
    checklist: [],
    enteredAt: new Date().toISOString(),
    appId,
  };
  return { ...state, actions: [...state.actions, action] };
}

/** Supprime l'action et la retire des prérequis des autres. */
export function removeAction(state: WorkflowState, id: string): WorkflowState {
  return {
    ...state,
    actions: state.actions
      .filter((a) => a.id !== id)
      .map((a) => (a.dependsOn.includes(id) ? { ...a, dependsOn: a.dependsOn.filter((d) => d !== id) } : a)),
  };
}

export function moveActionToStep(state: WorkflowState, actionId: string, stepId: string): WorkflowState {
  const step = state.steps.find((s) => s.id === stepId);
  if (!step) return state;
  return mapAction(state, actionId, (a) => (a.stepId === stepId ? a : enterStep(state, a, step)));
}

export function nextStepOf(state: WorkflowState, action: WorkflowAction): WorkflowStep | undefined {
  const idx = state.steps.findIndex((s) => s.id === action.stepId);
  return idx === -1 ? undefined : state.steps[idx + 1];
}

/** Recule d'une étape ; à la première étape, repasse simplement « à faire ». */
export function reopenAction(state: WorkflowState, action: WorkflowAction): WorkflowState {
  const idx = state.steps.findIndex((s) => s.id === action.stepId);
  const previous = state.steps[idx - 1];
  if (!previous) return patchAction(state, action.id, { status: "todo" });
  return moveActionToStep(state, action.id, previous.id);
}

/** à faire → en cours → terminée (terminée = rangée dans la dernière étape) → rouverte. */
export function cycleStatus(state: WorkflowState, action: WorkflowAction): WorkflowState {
  if (action.status === "todo") return patchAction(state, action.id, { status: "doing" });
  if (action.status === "doing") {
    const last = lastStepId(state);
    if (last && action.stepId !== last) return moveActionToStep(state, action.id, last);
    return patchAction(state, action.id, { status: "done" });
  }
  return reopenAction(state, action);
}

/** Ajoute ou retire un prérequis ; refuse un lien qui fermerait une boucle. */
export function toggleDependency(state: WorkflowState, actionId: string, depId: string): WorkflowState {
  const action = state.actions.find((a) => a.id === actionId);
  if (!action || actionId === depId) return state;
  const has = action.dependsOn.includes(depId);
  if (!has && dependsTransitively(state.actions, depId, actionId)) return state;
  return mapAction(state, actionId, (a) => ({
    ...a,
    dependsOn: has ? a.dependsOn.filter((d) => d !== depId) : [...a.dependsOn, depId],
  }));
}

export function toggleChecklistItem(state: WorkflowState, actionId: string, itemId: string): WorkflowState {
  return mapAction(state, actionId, (a) => ({
    ...a,
    checklist: a.checklist.map((c) => (c.id === itemId ? { ...c, done: !c.done } : c)),
  }));
}

export function addChecklistItem(state: WorkflowState, actionId: string, label: string): WorkflowState {
  const trimmed = label.trim();
  if (!trimmed) return state;
  return mapAction(state, actionId, (a) => ({
    ...a,
    checklist: [...a.checklist, { id: genId(), label: trimmed, done: false }],
  }));
}

export function removeChecklistItem(state: WorkflowState, actionId: string, itemId: string): WorkflowState {
  return mapAction(state, actionId, (a) => ({ ...a, checklist: a.checklist.filter((c) => c.id !== itemId) }));
}

/** Réarmer une alarme efface le drapeau « sonné » pour qu'elle puisse resonner. */
export function setActionAlarm(state: WorkflowState, actionId: string, alarmAt: string | undefined): WorkflowState {
  return patchAction(state, actionId, { alarmAt, alarmFired: undefined });
}

/** Actions dont le rappel est échu et n'a pas encore sonné. */
export function dueAlarms(state: WorkflowState, now = Date.now()): WorkflowAction[] {
  return state.actions.filter((a) => {
    if (!a.alarmAt || a.alarmFired) return false;
    const t = new Date(a.alarmAt).getTime();
    return !Number.isNaN(t) && now >= t;
  });
}

export function markAlarmsFired(state: WorkflowState, ids: Set<string>): WorkflowState {
  return { ...state, actions: state.actions.map((a) => (ids.has(a.id) ? { ...a, alarmFired: true } : a)) };
}

// ─── Glisser-déposer ────────────────────────────────────────────────────────

function arrayMove<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * Dépose l'action `draggedId` sur `overId`, qui est soit une étape (conteneur),
 * soit une autre action. Même étape : réordonne ; autre étape : y fait entrer l'action.
 */
export function dropAction(state: WorkflowState, draggedId: string, overId: string): WorkflowState {
  if (draggedId === overId) return state;
  const from = state.actions.findIndex((a) => a.id === draggedId);
  if (from === -1) return state;
  const moving = state.actions[from];

  const overIsStep = state.steps.some((s) => s.id === overId);
  const targetStepId = overIsStep ? overId : state.actions.find((a) => a.id === overId)?.stepId;
  if (!targetStepId) return state;

  if (targetStepId === moving.stepId) {
    // Réordonner dans l'étape — déposer sur le conteneur lui-même ne fait rien.
    if (overIsStep) return state;
    const to = state.actions.findIndex((a) => a.id === overId);
    if (to === -1 || to === from) return state;
    return { ...state, actions: arrayMove(state.actions, from, to) };
  }

  const step = state.steps.find((s) => s.id === targetStepId);
  if (!step) return state;
  const moved = enterStep(state, moving, step);
  const rest = state.actions.filter((a) => a.id !== draggedId);
  let insertAt = rest.findIndex((a) => a.id === overId);
  if (insertAt === -1) {
    // Déposée sur le conteneur : après la dernière action de l'étape.
    const lastOfStep = rest.reduce((acc, a, i) => (a.stepId === targetStepId ? i : acc), -1);
    insertAt = lastOfStep === -1 ? rest.length : lastOfStep + 1;
  }
  rest.splice(insertAt, 0, moved);
  return { ...state, actions: rest };
}

// ─── Applications ───────────────────────────────────────────────────────────

/** Crée une application ; renvoie aussi son id pour pouvoir la sélectionner. */
export function addApp(state: WorkflowState, name: string, color?: string): { state: WorkflowState; id?: string } {
  const trimmed = name.trim();
  if (!trimmed) return { state };
  const id = genId();
  return {
    id,
    state: { ...state, apps: [...state.apps, { id, name: trimmed, color: color || nextAppColor(state.apps.length) }] },
  };
}

export function updateApp(state: WorkflowState, appId: string, patch: Partial<Omit<AppTag, "id">>): WorkflowState {
  return { ...state, apps: state.apps.map((a) => (a.id === appId ? { ...a, ...patch } : a)) };
}

/** Supprime l'application et désaffecte toutes les actions qui la référençaient. */
export function removeApp(state: WorkflowState, appId: string): WorkflowState {
  return {
    ...state,
    apps: state.apps.filter((a) => a.id !== appId),
    actions: state.actions.map((a) => (a.appId === appId ? { ...a, appId: undefined } : a)),
  };
}

// ─── Étapes ─────────────────────────────────────────────────────────────────

function mapStep(state: WorkflowState, id: string, patch: Partial<WorkflowStep>): WorkflowState {
  return { ...state, steps: state.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)) };
}

export function addStep(state: WorkflowState, name: string): WorkflowState {
  const trimmed = name.trim();
  if (!trimmed) return state;
  return { ...state, steps: [...state.steps, { id: genId(), name: trimmed, exitCriteria: [] }] };
}

export function renameStep(state: WorkflowState, id: string, name: string): WorkflowState {
  const trimmed = name.trim();
  return trimmed ? mapStep(state, id, { name: trimmed }) : state;
}

export function setStepColor(state: WorkflowState, id: string, color: string): WorkflowState {
  return mapStep(state, id, { color });
}

export function setStepCriteria(state: WorkflowState, id: string, exitCriteria: string[]): WorkflowState {
  return mapStep(state, id, { exitCriteria });
}

export function moveStep(state: WorkflowState, id: string, dir: -1 | 1): WorkflowState {
  const idx = state.steps.findIndex((s) => s.id === id);
  const target = idx + dir;
  if (idx === -1 || target < 0 || target >= state.steps.length) return state;
  return { ...state, steps: arrayMove(state.steps, idx, target) };
}

/** Étape qui recueille les actions d'une étape supprimée : la précédente, sinon la suivante. */
export function fallbackStepFor(state: WorkflowState, id: string): WorkflowStep | undefined {
  const idx = state.steps.findIndex((s) => s.id === id);
  if (idx === -1) return undefined;
  return state.steps[idx - 1] ?? state.steps[idx + 1];
}

/** Supprime une étape (jamais la dernière restante) et déplace ses actions. */
export function removeStep(state: WorkflowState, id: string): WorkflowState {
  if (state.steps.length <= 1) return state;
  const fallback = fallbackStepFor(state, id);
  if (!fallback) return state;
  const next: WorkflowState = { ...state, steps: state.steps.filter((s) => s.id !== id) };
  return {
    ...next,
    actions: next.actions.map((a) => (a.stepId === id ? enterStep(next, a, fallback) : a)),
  };
}

// ─── États initiaux ─────────────────────────────────────────────────────────

export function defaultState(): WorkflowState {
  return {
    steps: DEFAULT_STEP_NAMES.map((name) => ({ id: genId(), name, exitCriteria: [] })),
    actions: [],
    apps: [],
  };
}

/** Exemple réaliste pour la galerie : la refonte d'un site et de son appli mobile. */
export function demoState(): WorkflowState {
  const now = Date.now();
  const daysAgo = (n: number) => new Date(now - n * 86_400_000).toISOString();
  const inDays = (n: number) => toISODate(new Date(now + n * 86_400_000));

  const steps: WorkflowStep[] = [
    { id: "s-backlog", name: "Backlog", exitCriteria: [] },
    { id: "s-todo", name: "À faire", exitCriteria: ["Besoin validé", "Estimation faite"] },
    { id: "s-doing", name: "En cours", exitCriteria: ["Revue de code faite", "Tests passés"] },
    { id: "s-review", name: "Recette", exitCriteria: ["Validé par le client"] },
    { id: "s-done", name: "Terminé", exitCriteria: [] },
  ];
  const apps: AppTag[] = [
    { id: "app-site", name: "Site vitrine", color: "#4f7cff" },
    { id: "app-mobile", name: "App mobile", color: "#a855f7" },
    { id: "app-admin", name: "Back-office", color: "#10b981" },
  ];
  const base = { notes: "", owner: "", due: "", dependsOn: [] as string[], checklist: [] as ChecklistItem[] };
  const actions: WorkflowAction[] = [
    {
      ...base,
      id: "a-maquettes",
      title: "Maquettes de la page d'accueil",
      stepId: "s-review",
      status: "doing",
      priority: "high",
      owner: "Camille",
      due: inDays(2),
      enteredAt: daysAgo(1),
      appId: "app-site",
      notes: "Deux variantes à présenter : hero vidéo ou illustration.",
      checklist: [{ id: "c-1", label: "Validé par le client", done: false }],
    },
    {
      ...base,
      id: "a-api",
      title: "API d'authentification",
      stepId: "s-doing",
      status: "doing",
      priority: "urgent",
      owner: "Thomas",
      due: inDays(-1),
      enteredAt: daysAgo(7),
      appId: "app-admin",
      checklist: [
        { id: "c-2", label: "Revue de code faite", done: true },
        { id: "c-3", label: "Tests passés", done: false },
      ],
    },
    {
      ...base,
      id: "a-login",
      title: "Écran de connexion mobile",
      stepId: "s-todo",
      status: "todo",
      priority: "high",
      owner: "Inès",
      due: inDays(6),
      enteredAt: daysAgo(2),
      appId: "app-mobile",
      dependsOn: ["a-api"],
      checklist: [
        { id: "c-4", label: "Besoin validé", done: true },
        { id: "c-5", label: "Estimation faite", done: false },
      ],
    },
    {
      ...base,
      id: "a-seo",
      title: "Audit SEO des pages produits",
      stepId: "s-todo",
      status: "todo",
      priority: "normal",
      owner: "Camille",
      due: inDays(10),
      enteredAt: daysAgo(3),
      appId: "app-site",
      alarmAt: new Date(now + 26 * 3_600_000).toISOString(),
    },
    {
      ...base,
      id: "a-export",
      title: "Export CSV des commandes",
      stepId: "s-backlog",
      status: "todo",
      priority: "low",
      enteredAt: daysAgo(12),
      appId: "app-admin",
    },
    {
      ...base,
      id: "a-push",
      title: "Notifications push",
      stepId: "s-backlog",
      status: "todo",
      priority: "normal",
      enteredAt: daysAgo(4),
      appId: "app-mobile",
      dependsOn: ["a-login"],
    },
    {
      ...base,
      id: "a-charte",
      title: "Charte graphique validée",
      stepId: "s-done",
      status: "done",
      priority: "normal",
      owner: "Camille",
      enteredAt: daysAgo(9),
      appId: "app-site",
    },
    {
      ...base,
      id: "a-hebergement",
      title: "Choix de l'hébergeur",
      stepId: "s-done",
      status: "done",
      priority: "high",
      owner: "Thomas",
      enteredAt: daysAgo(15),
    },
  ];
  return { steps, actions, apps };
}
