import type { ReactNode } from "react";

type EditorSectionProps = { label: string; aside?: ReactNode; children: ReactNode };

/** Zone douce et titrée de l'éditeur de tâche. */
export function EditorSection({ label, aside, children }: EditorSectionProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-surface-secondary p-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.8148rem] font-bold tracking-[.06em] text-muted uppercase">{label}</span>
        {aside}
      </div>
      {children}
    </div>
  );
}
