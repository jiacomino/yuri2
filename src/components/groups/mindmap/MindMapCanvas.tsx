import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
  type Viewport,
} from "@xyflow/react";
import type { BodyProps } from "../types";
import { MindMapContext, type MindMapActions } from "./MindMapContext";
import { MindMapToolbar } from "./MindMapToolbar";
import { MindNode } from "./MindNode";
import {
  CHILD_DX,
  CHILD_DY,
  DEFAULT_NODE_COLOR,
  fromFlow,
  newId,
  toFlow,
  type MindFlowNode,
  type MindMapState,
} from "./state";

/** Délai avant de remonter l'état au parent (les glisser-déposer émettent à chaque frame). */
const EMIT_DEBOUNCE_MS = 300;

// Doit rester au niveau du module : un nouvel objet à chaque rendu remonte tous les nœuds.
const nodeTypes = { mind: MindNode };
const defaultEdgeOptions = { type: "default" as const };

export function MindMapCanvas({ value, onChange }: BodyProps<MindMapState>) {
  const initial = useMemo(() => toFlow(value), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [nodes, setNodes] = useState<MindFlowNode[]>(initial.nodes);
  const [edges, setEdges] = useState<Edge[]>(initial.edges);
  const [viewport, setViewport] = useState<Viewport | undefined>(value.viewport);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();

  /** Dernier état sérialisé échangé avec le parent (émis ou reçu). */
  const lastSynced = useRef(JSON.stringify(value));
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const pending = useRef<{ timer: number; next: MindMapState } | null>(null);

  // Changement externe de `value` (autre source que ce composant) → on recharge.
  useEffect(() => {
    const serialized = JSON.stringify(value);
    if (serialized === lastSynced.current) return;
    lastSynced.current = serialized;
    const next = toFlow(value);
    setNodes(next.nodes);
    setEdges(next.edges);
    setViewport(value.viewport);
  }, [value]);

  // Remontée (différée) des modifications locales.
  useEffect(() => {
    const next = fromFlow(nodes, edges, viewport);
    const serialized = JSON.stringify(next);
    if (serialized === lastSynced.current) return;
    if (pending.current) window.clearTimeout(pending.current.timer);
    const timer = window.setTimeout(() => {
      pending.current = null;
      lastSynced.current = serialized;
      onChangeRef.current(next);
    }, EMIT_DEBOUNCE_MS);
    pending.current = { timer, next };
  }, [nodes, edges, viewport]);

  // Au démontage, on vide la remontée en attente plutôt que de la perdre.
  useEffect(
    () => () => {
      const p = pending.current;
      if (!p) return;
      window.clearTimeout(p.timer);
      onChangeRef.current(p.next);
    },
    [],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<MindFlowNode>[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );
  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({ ...connection, id: newId() }, eds)),
    [],
  );

  const actions = useMemo<MindMapActions>(
    () => ({
      rename: (id, label) =>
        setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, label } } : n))),

      // Nouvel enfant à droite du parent, empilé sous les frères existants.
      addChild: (parentId) => {
        const childId = newId();
        setNodes((nds) => {
          const parent = nds.find((n) => n.id === parentId);
          if (!parent) return nds;
          const siblings = nds.filter(
            (n) => n.id !== parentId && Math.abs(n.position.x - (parent.position.x + CHILD_DX)) < 1,
          ).length;
          return [
            ...nds.map((n) => (n.selected ? { ...n, selected: false } : n)),
            {
              id: childId,
              type: "mind" as const,
              position: { x: parent.position.x + CHILD_DX, y: parent.position.y + siblings * CHILD_DY },
              data: { label: "Nouvelle idée", color: parent.data.color },
              selected: true,
            },
          ];
        });
        setEdges((eds) => [...eds, { id: newId(), source: parentId, target: childId }]);
      },

      remove: (id) => {
        setNodes((nds) => nds.filter((n) => n.id !== id));
        setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
      },
    }),
    [],
  );

  /** Ajoute une idée libre ; `at` est un point écran (double-clic), sinon le centre. */
  const addNode = useCallback(
    (at?: { x: number; y: number }) => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      const screen =
        at ?? (rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : { x: 0, y: 0 });
      const position = screenToFlowPosition(screen);
      setNodes((nds) => [
        ...nds.map((n) => (n.selected ? { ...n, selected: false } : n)),
        {
          id: newId(),
          type: "mind" as const,
          position,
          data: { label: "Nouvelle idée", color: DEFAULT_NODE_COLOR },
          selected: true,
        },
      ]);
    },
    [screenToFlowPosition],
  );

  const selectedIds = nodes.filter((n) => n.selected).map((n) => n.id);

  function recolorSelection(color: string) {
    setNodes((nds) => nds.map((n) => (n.selected ? { ...n, data: { ...n.data, color } } : n)));
  }

  function removeSelection() {
    const ids = new Set(selectedIds);
    if (ids.size === 0) return;
    setNodes((nds) => nds.filter((n) => !ids.has(n.id)));
    setEdges((eds) => eds.filter((e) => !ids.has(e.source) && !ids.has(e.target)));
  }

  return (
    <MindMapContext.Provider value={actions}>
      <div
        ref={wrapperRef}
        className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-surface-secondary"
        onDoubleClick={(e) => {
          // Seul le fond vide crée une idée : les nœuds gèrent leur double-clic (renommer).
          const target = e.target as HTMLElement;
          if (!target.classList.contains("react-flow__pane")) return;
          addNode({ x: e.clientX, y: e.clientY });
        }}
      >
        <ReactFlow<MindFlowNode>
          className="mindmap-flow"
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          connectionMode={ConnectionMode.Loose}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onMoveEnd={(_, vp) => setViewport(vp)}
          defaultViewport={value.viewport}
          fitView={!value.viewport}
          fitViewOptions={{ padding: 0.15, maxZoom: 1 }}
          zoomOnDoubleClick={false}
          minZoom={0.2}
          maxZoom={2.5}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1.5} />
          <Controls showInteractive={false} position="bottom-left" />
          <MiniMap
            position="top-right"
            pannable
            zoomable
            style={{ height: 64, width: 96 }}
            nodeColor={(n) => (n as MindFlowNode).data.color}
            nodeBorderRadius={6}
          />
        </ReactFlow>

        <MindMapToolbar
          selectedCount={selectedIds.length}
          onAdd={() => addNode()}
          onRecolor={recolorSelection}
          onRemoveSelection={removeSelection}
          onFit={() => void fitView({ padding: 0.15, maxZoom: 1, duration: 300 })}
        />
      </div>
    </MindMapContext.Provider>
  );
}
