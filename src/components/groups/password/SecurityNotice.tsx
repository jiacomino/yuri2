import { ShieldAlert } from "lucide-react";

/** Avertissement : les identifiants sont stockés en clair pour l'instant. */
export function SecurityNotice() {
  return (
    <div className="flex shrink-0 items-start gap-2 rounded-[10px] bg-amber-50 px-2.5 py-2 text-[0.8889rem] font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
      <ShieldAlert className="mt-px size-3.5 shrink-0" />
      <span className="leading-snug">Stocké en clair sur cet ordinateur. À réserver aux comptes peu sensibles.</span>
    </div>
  );
}
