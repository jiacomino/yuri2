import { AlertCircle } from "lucide-react";

/** Erreur de synchronisation, affichée au-dessus de l'agenda. */
export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-1.5 rounded-[10px] bg-danger/10 px-2.5 py-2 text-[0.8889rem] font-medium text-danger">
      <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
      <span className="flex-1 break-words">{message}</span>
    </div>
  );
}
