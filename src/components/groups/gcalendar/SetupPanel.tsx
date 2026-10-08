import { KeyRound } from "lucide-react";
import { CredentialsForm } from "./CredentialsForm";

/** Affiché tant qu'aucun identifiant OAuth n'est configuré. */
export function SetupPanel({ onSaved }: { onSaved: () => void }) {
  return (
    <div className="flex h-full items-start justify-center overflow-y-auto">
      <div className="flex w-full max-w-sm flex-col gap-3 pt-1">
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
            <KeyRound className="size-5" />
          </span>
          <div>
            <p className="text-[1.037rem] font-bold tracking-[-0.01em]">Configurer Google Agenda</p>
            <p className="text-[0.8889rem] text-muted">Identifiants OAuth requis</p>
          </div>
        </div>
        <div className="rounded-xl bg-surface-secondary p-2.5">
          <CredentialsForm onSaved={onSaved} />
        </div>
      </div>
    </div>
  );
}
