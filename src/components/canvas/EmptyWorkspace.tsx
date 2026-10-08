import { Button } from "@heroui/react";
import { LayoutDashboard, Plus } from "lucide-react";

/** Canevas vide : invitation à ajouter un premier composant. */
export function EmptyWorkspace({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="grid h-full place-items-center p-10">
      <div className="flex max-w-sm flex-col items-center text-center">
        <span className="grid size-12 place-items-center rounded-[14px] bg-accent/12 text-accent">
          <LayoutDashboard className="size-5" />
        </span>
        <h2 className="mt-4 text-[1.1852rem] font-bold tracking-[-0.01em]">Cet espace est vide</h2>
        <p className="mt-1.5 text-[0.963rem] leading-relaxed text-muted">
          Ajoute des liens, des notes, un kanban, un calendrier… Chaque composant se déplace par sa barre de titre et
          se redimensionne par son coin.
        </p>
        <Button className="mt-5" onPress={onAdd}>
          <Plus className="size-4" />
          Ajouter un composant
        </Button>
      </div>
    </div>
  );
}
