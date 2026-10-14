import { memo, useCallback, useMemo } from "react";
import { GroupFrame } from "@/components/group/GroupFrame";
import { findDefinition } from "@/components/groups/registry";
import type { GroupRecord, Workspace } from "@/types/workspace";

type CanvasGroupProps = {
  group: GroupRecord;
  workspaces: Workspace[];
  onStateChange: (id: string, state: unknown) => void;
  onMinimize: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (group: GroupRecord) => void;
  onMove: (group: GroupRecord, workspaceId: string) => void;
  onTagClick: (tag: string) => void;
};

/** Un composant du canevas : cadre + corps du type correspondant. */
export const CanvasGroup = memo(function CanvasGroup({
  group,
  workspaces,
  onStateChange,
  onMinimize,
  onEdit,
  onDelete,
  onMove,
  onTagClick,
}: CanvasGroupProps) {
  const def = findDefinition(group.kind);
  const handleChange = useCallback((next: unknown) => onStateChange(group.id, next), [group.id, onStateChange]);
  const moveTargets = useMemo(
    () => workspaces.filter((w) => w.id !== group.workspaceId),
    [workspaces, group.workspaceId],
  );

  if (!def) {
    return (
      <GroupFrame title={group.name} icon={null} color="#64748b" className="h-full" onDelete={() => onDelete(group)}>
        <p className="text-xs text-muted">Type de composant inconnu : « {group.kind} ».</p>
      </GroupFrame>
    );
  }

  const Icon = def.icon;
  const Body = def.Body;
  return (
    <GroupFrame
      title={group.name}
      icon={<Icon className="size-4" />}
      color={group.color ?? def.color}
      tags={group.tags}
      className="h-full"
      onMinimize={() => onMinimize(group.id)}
      onEdit={() => onEdit(group.id)}
      onDelete={() => onDelete(group)}
      moveTargets={moveTargets}
      onMoveTo={(workspaceId) => onMove(group, workspaceId)}
      onTagClick={onTagClick}
    >
      <Body groupId={group.id} value={group.state ?? def.defaultState()} onChange={handleChange} />
    </GroupFrame>
  );
});
