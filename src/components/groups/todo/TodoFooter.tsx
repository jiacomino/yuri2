import { Button } from "@heroui/react";

type TodoFooterProps = {
  done: number;
  total: number;
  onClearCompleted: () => void;
};

/** Compteur de progression et purge des tâches terminées. */
export function TodoFooter({ done, total, onClearCompleted }: TodoFooterProps) {
  if (total === 0) return null;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="flex shrink-0 items-center gap-2.5 border-t border-separator pt-2.5 text-[0.8889rem] text-muted">
      <span className="shrink-0 font-semibold tabular-nums">
        {done} / {total} terminée{total > 1 ? "s" : ""}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-default">
        <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${pct}%` }} />
      </div>
      {done > 0 && (
        <Button size="sm" variant="ghost" onPress={onClearCompleted} className="h-6 px-2 text-[0.8889rem] font-semibold text-muted">
          Effacer terminées
        </Button>
      )}
    </div>
  );
}
