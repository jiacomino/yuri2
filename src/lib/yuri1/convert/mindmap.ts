/**
 * Carte mentale yuri 1 → yuri2. Même forme de stockage (nœuds, liens, cadrage) :
 * on valide, on écarte les nœuds sans position et les liens orphelins.
 */
import {
  DEFAULT_NODE_COLOR,
  defaultState,
  type MindMapEdge,
  type MindMapNode,
  type MindMapState,
} from "@/components/groups/mindmap/state";
import type { Converter } from "../types";
import { arr, isObj, num, obj, str } from "./util";

export const convertMindMap: Converter<MindMapState> = (raw) => {
  const r = obj(raw);
  const ids = new Set<string>();
  const nodes: MindMapNode[] = [];
  for (const n of arr(r.nodes)) {
    if (!isObj(n) || typeof n.id !== "string" || ids.has(n.id)) continue;
    const pos = obj(n.position);
    if (typeof pos.x !== "number" || typeof pos.y !== "number") continue;
    const data = obj(n.data);
    ids.add(n.id);
    nodes.push({
      id: n.id,
      position: { x: num(pos.x, 0), y: num(pos.y, 0) },
      data: { label: str(data.label), color: str(data.color) || DEFAULT_NODE_COLOR },
    });
  }
  if (nodes.length === 0) return defaultState();

  const edgeIds = new Set<string>();
  const edges: MindMapEdge[] = [];
  for (const e of arr(r.edges)) {
    if (!isObj(e) || typeof e.source !== "string" || typeof e.target !== "string") continue;
    if (!ids.has(e.source) || !ids.has(e.target)) continue;
    const id = str(e.id) || `${e.source}-${e.target}`;
    if (edgeIds.has(id)) continue;
    edgeIds.add(id);
    edges.push({ id, source: e.source, target: e.target });
  }

  const vp = obj(r.viewport);
  const zoom = num(vp.zoom, 0);
  const viewport =
    typeof vp.x === "number" && typeof vp.y === "number" && zoom > 0
      ? { x: num(vp.x, 0), y: num(vp.y, 0), zoom }
      : undefined;

  return { nodes, edges, ...(viewport ? { viewport } : {}) };
};
