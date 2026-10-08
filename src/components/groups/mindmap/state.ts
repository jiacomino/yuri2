import type { Edge, Node, Viewport } from "@xyflow/react";

/** Couleurs proposées pour les idées ; la première est celle par défaut. */
export const NODE_COLORS = [
  "#4f7cff",
  "#a855f7",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#ef4444",
  "#64748b",
];

export const DEFAULT_NODE_COLOR = NODE_COLORS[0];

/** Écart horizontal / vertical d'une idée enfant par rapport à son parent. */
export const CHILD_DX = 210;
export const CHILD_DY = 70;

export type MindNodeData = { label: string; color: string };

/** Idée persistée (sans les drapeaux transitoires de React Flow). */
export type MindMapNode = {
  id: string;
  position: { x: number; y: number };
  data: MindNodeData;
};

export type MindMapEdge = { id: string; source: string; target: string };

export type MindMapState = {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  /** Cadrage mémorisé ; absent = ajustement automatique (fitView). */
  viewport?: Viewport;
};

/** Nœud React Flow utilisé à l'exécution. */
export type MindFlowNode = Node<MindNodeData, "mind">;

export function newId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export function defaultState(): MindMapState {
  return {
    nodes: [{ id: newId(), position: { x: 0, y: 0 }, data: { label: "Idée centrale", color: DEFAULT_NODE_COLOR } }],
    edges: [],
  };
}

export function demoState(): MindMapState {
  const n = (id: string, x: number, y: number, label: string, color: string): MindMapNode => ({
    id,
    position: { x, y },
    data: { label, color },
  });
  const nodes: MindMapNode[] = [
    n("root", 0, 0, "Lancement du site", "#4f7cff"),
    n("design", -260, -110, "Design", "#a855f7"),
    n("maquettes", -500, -170, "Maquettes Figma", "#a855f7"),
    n("charte", -500, -90, "Charte graphique", "#a855f7"),
    n("contenu", -260, 110, "Contenu", "#10b981"),
    n("redaction", -500, 90, "Rédaction des pages", "#10b981"),
    n("photos", -500, 170, "Shooting photo", "#10b981"),
    n("tech", 260, -110, "Technique", "#06b6d4"),
    n("hebergement", 480, -170, "Hébergement OVH", "#06b6d4"),
    n("seo", 480, -90, "SEO & sitemap", "#06b6d4"),
    n("marketing", 260, 110, "Marketing", "#f59e0b"),
    n("newsletter", 480, 90, "Newsletter de lancement", "#f59e0b"),
    n("reseaux", 480, 170, "Réseaux sociaux", "#ec4899"),
  ];
  const links: [string, string][] = [
    ["root", "design"],
    ["design", "maquettes"],
    ["design", "charte"],
    ["root", "contenu"],
    ["contenu", "redaction"],
    ["contenu", "photos"],
    ["root", "tech"],
    ["tech", "hebergement"],
    ["tech", "seo"],
    ["root", "marketing"],
    ["marketing", "newsletter"],
    ["marketing", "reseaux"],
  ];
  return {
    nodes,
    edges: links.map(([source, target]) => ({ id: `${source}-${target}`, source, target })),
  };
}

/** État persisté → nœuds et liens React Flow. */
export function toFlow(state: MindMapState): { nodes: MindFlowNode[]; edges: Edge[] } {
  const nodes: MindFlowNode[] = state.nodes.map((n) => ({
    id: n.id,
    type: "mind",
    position: { x: n.position.x, y: n.position.y },
    data: { label: n.data.label, color: n.data.color || DEFAULT_NODE_COLOR },
  }));
  const ids = new Set(nodes.map((n) => n.id));
  const edges: Edge[] = state.edges
    .filter((e) => ids.has(e.source) && ids.has(e.target))
    .map((e) => ({ id: e.id, source: e.source, target: e.target }));
  return { nodes, edges };
}

/** Nœuds et liens React Flow → état persisté (positions arrondies). */
export function fromFlow(nodes: MindFlowNode[], edges: Edge[], viewport?: Viewport): MindMapState {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
      data: { label: n.data.label, color: n.data.color },
    })),
    edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
    ...(viewport ? { viewport } : {}),
  };
}
