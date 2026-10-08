import { useEffect, useState, type CSSProperties } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMindMapActions } from "./MindMapContext";
import type { MindFlowNode } from "./state";

const SIDES = [
  { id: "t", position: Position.Top },
  { id: "r", position: Position.Right },
  { id: "b", position: Position.Bottom },
  { id: "l", position: Position.Left },
] as const;

/**
 * Idée de la carte. Chaque côté expose une poignée `source` ; avec `ConnectionMode.Loose`
 * un lien peut partir de — et arriver sur — n'importe quel côté.
 */
export function MindNode({ id, data, selected }: NodeProps<MindFlowNode>) {
  const { rename, addChild, remove } = useMindMapActions();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.label);

  useEffect(() => {
    if (!editing) setDraft(data.label);
  }, [data.label, editing]);

  function commit() {
    rename(id, draft.trim() || "Sans titre");
    setEditing(false);
  }

  return (
    <div
      className={cn("mind-node group/node", selected && "mind-node--selected")}
      style={{ "--node-color": data.color } as CSSProperties}
    >
      {SIDES.map((s) => (
        <Handle key={s.id} id={s.id} type="source" position={s.position} />
      ))}

      <span className="mind-node__dot" aria-hidden />

      {editing ? (
        <textarea
          autoFocus
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.currentTarget.value)}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              setDraft(data.label);
              setEditing(false);
            }
          }}
          className="nodrag nowheel w-40 resize-none rounded-lg bg-surface px-1.5 py-1 text-[0.9259rem] font-medium text-foreground outline-none ring-2 ring-accent/40"
        />
      ) : (
        <div
          onDoubleClick={() => setEditing(true)}
          title="Double-cliquer pour renommer"
          className="min-w-0 cursor-text whitespace-pre-wrap break-words leading-snug"
        >
          {data.label || <span className="font-medium italic text-muted">Sans titre</span>}
        </div>
      )}

      {!editing && (
        <div className="nodrag absolute -top-2.5 -right-2.5 flex items-center gap-0.5 opacity-0 transition-opacity group-hover/node:opacity-100">
          <button
            type="button"
            onClick={() => addChild(id)}
            aria-label="Ajouter une idée liée"
            title="Ajouter une idée liée"
            className="mind-node__action mind-node__action--add"
          >
            <Plus className="size-3" />
          </button>
          <button
            type="button"
            onClick={() => remove(id)}
            aria-label="Supprimer l'idée"
            title="Supprimer"
            className="mind-node__action mind-node__action--remove"
          >
            <X className="size-3" />
          </button>
        </div>
      )}
    </div>
  );
}
