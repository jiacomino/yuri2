import { useMemo } from "react";
import ReactGridLayout, { getCompactor, useContainerWidth, type Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { GRID_COLS, GRID_MARGIN, GRID_ROW_HEIGHT } from "@/lib/grid";
import type { GroupRecord, LayoutPatch } from "@/types/workspace";
import { cn } from "@/lib/utils";
import { CanvasGroup } from "./CanvasGroup";
import "./GroupCanvas.css";

// Placement libre, comme dans yuri : pas de tassement, chevauchement permis.
const compactor = getCompactor(null, true, false);

type GroupCanvasProps = {
  groups: GroupRecord[];
  onLayoutChange: (patches: LayoutPatch[]) => void;
  onStateChange: (id: string, state: unknown) => void;
  onMinimize: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (group: GroupRecord) => void;
  onTagClick: (tag: string) => void;
  /** Résultat du filtre (Ctrl+F) : ids correspondants, ou null sans filtre actif. */
  matchIds?: Set<string> | null;
};

/** Canevas d'un espace : composants déplaçables (barre de titre) et redimensionnables. */
export function GroupCanvas({
  groups,
  onLayoutChange,
  onStateChange,
  onMinimize,
  onEdit,
  onDelete,
  onTagClick,
  matchIds,
}: GroupCanvasProps) {
  const { width, containerRef, mounted } = useContainerWidth();

  const layout: Layout = useMemo(
    () => groups.map((g) => ({ i: g.id, x: g.x, y: g.y, w: g.w, h: g.h, minW: 4, minH: 5 })),
    [groups],
  );

  function persist(next: Layout) {
    onLayoutChange(next.map((l) => ({ id: l.i, x: l.x, y: l.y, w: l.w, h: l.h })));
  }

  return (
    <div ref={containerRef} className="group-canvas">
      {mounted && (
        <ReactGridLayout
          width={width}
          layout={layout}
          compactor={compactor}
          gridConfig={{ cols: GRID_COLS, rowHeight: GRID_ROW_HEIGHT, margin: [GRID_MARGIN, GRID_MARGIN] }}
          dragConfig={{ enabled: true, handle: ".group-handle", cancel: ".group-actions, .group-tag" }}
          resizeConfig={{ enabled: true, handles: ["se"] }}
          onDragStop={persist}
          onResizeStop={persist}
        >
          {groups.map((group) => (
            <div
              key={group.id}
              data-group-id={group.id}
              className={cn(matchIds && (matchIds.has(group.id) ? "search-hit" : "search-miss"))}
            >
              <CanvasGroup
                group={group}
                onStateChange={onStateChange}
                onMinimize={onMinimize}
                onEdit={onEdit}
                onDelete={onDelete}
                onTagClick={onTagClick}
              />
            </div>
          ))}
        </ReactGridLayout>
      )}
    </div>
  );
}
