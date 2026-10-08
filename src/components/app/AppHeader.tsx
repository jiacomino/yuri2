import type { ReactNode } from "react";
import { Button } from "@heroui/react";
import { Camera, Import, LayoutGrid, Plus, Settings } from "lucide-react";
import { runYuri1Import } from "@/lib/yuri1/run";

type AppHeaderProps = {
  /** Onglets des espaces de travail. */
  children: ReactNode;
  onAddGroup: () => void;
  onOpenSettings: () => void;
  /** Range en lignes alignées les composants de l'espace actif. */
  onArrange: () => void;
  /** Capture l'écran principal dans un nouveau composant Image. */
  onCapture: () => void;
  capturing: boolean;
  canArrange: boolean;
  canAddGroup: boolean;
  /** Barre de filtre (Ctrl+F), affichée quand elle est ouverte. */
  search?: ReactNode;
};

/**
 * Barre du haut : nom de l'app, onglets des espaces, filtre, capture d'écran, réorganisation, import yuri 1,
 * bouton d'ajout de composant, paramètres.
 */
export function AppHeader({
  children,
  onAddGroup,
  onOpenSettings,
  onArrange,
  canArrange,
  onCapture,
  capturing,
  canAddGroup,
  search,
}: AppHeaderProps) {
  return (
    <header className="relative z-10 flex h-16 shrink-0 items-center gap-5 border-b border-border/70 bg-surface/80 px-5 backdrop-blur-xl">
      <div className="flex shrink-0 items-center gap-2.5">
        <span className="grid size-[30px] place-items-center rounded-[9px] bg-accent text-[1.1111rem] font-extrabold text-accent-foreground shadow-[inset_0_1px_0_rgba(255,255,255,.25),0_2px_6px_color-mix(in_oklab,var(--accent)_40%,transparent)]">
          y
        </span>
        <span className="text-[1.1852rem] font-extrabold tracking-[-0.02em]">yuri2</span>
      </div>
      <div className="min-w-0 flex-1">{children}</div>
      {search}
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label="Capture d'écran (nouveau composant Image)"
        onPress={onCapture}
        isPending={capturing}
        isDisabled={!canAddGroup}
      >
        <Camera className="size-4" />
      </Button>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label="Réorganiser l'espace (aligner les composants)"
        onPress={onArrange}
        isDisabled={!canArrange}
      >
        <LayoutGrid className="size-4" />
      </Button>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label="Importer depuis yuri 1"
        onPress={() => void runYuri1Import()}
      >
        <Import className="size-4" />
      </Button>
      <Button
        size="sm"
        className="h-9 rounded-[10px] px-4 font-bold shadow-[inset_0_1px_0_rgba(255,255,255,.2),0_2px_8px_color-mix(in_oklab,var(--accent)_35%,transparent)]"
        onPress={onAddGroup}
        isDisabled={!canAddGroup}
      >
        <Plus className="size-4" strokeWidth={2.4} />
        Ajouter un composant
      </Button>
      <Button isIconOnly size="sm" variant="ghost" aria-label="Paramètres (Ctrl+,)" onPress={onOpenSettings}>
        <Settings className="size-4" />
      </Button>
    </header>
  );
}
