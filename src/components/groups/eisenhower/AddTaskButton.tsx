import { Plus } from "lucide-react";

/** Bouton discret « Ajouter » en bas d'un quadrant. */
export function AddTaskButton({ onPress }: { onPress: () => void }) {
  return (
    <button
      type="button"
      onClick={onPress}
      className="flex h-8 w-full shrink-0 cursor-pointer items-center justify-center gap-1 rounded-[10px] border border-dashed border-foreground/15 text-[0.8889rem] font-semibold text-muted transition-colors hover:border-accent/50 hover:text-foreground"
    >
      <Plus className="size-3.5" />
      Ajouter
    </button>
  );
}
