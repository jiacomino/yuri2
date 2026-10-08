import { ImageUp } from "lucide-react";

/** Invite de chargement affichée tant qu'aucune image n'est présente. */
export function ImageDropZone({ onPick }: { onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="group/drop flex size-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-6 py-8 text-center transition-colors hover:border-accent/50"
    >
      <span className="mb-1 grid size-10 place-items-center rounded-xl bg-accent/12 text-accent transition-transform group-hover/drop:-translate-y-0.5">
        <ImageUp className="size-5" />
      </span>
      <span className="text-[0.963rem] font-semibold text-foreground">Cliquer ou glisser-déposer une image</span>
      <span className="text-[0.8889rem] text-muted">Puis « Annoter » : flèches, cadres, légendes, texte…</span>
    </button>
  );
}
