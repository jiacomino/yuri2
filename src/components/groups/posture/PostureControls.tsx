import { Button } from "@heroui/react";
import { Armchair, Footprints, Pause, PersonStanding, Play, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { PHASE_THEME } from "./phaseTheme";
import type { Phase } from "./state";

type PostureControlsProps = {
  phase: Phase;
  running: boolean;
  onSwitch: () => void;
  onMove: () => void;
  onStop: () => void;
  onToggleRun: () => void;
};

const BASE = "h-9 rounded-xl font-semibold";
const OUTLINE = cn(BASE, "border-border bg-surface text-foreground/80 hover:bg-surface-secondary");

/** Deux rangées : changement de posture / « Bouger », puis Arrêter / Démarrer-Pause. */
export function PostureControls({ phase, running, onSwitch, onMove, onStop, onToggleRun }: PostureControlsProps) {
  const isSit = phase === "sit";
  // Le bouton de bascule prend la teinte de la phase visée.
  const target = PHASE_THEME[isSit ? "stand" : "sit"];
  return (
    <div className="grid w-full max-w-72 shrink-0 grid-cols-2 gap-2">
      <Button onPress={onSwitch} className={cn(BASE, target.soft, target.textStrong)}>
        {isSit ? <PersonStanding className="size-4" /> : <Armchair className="size-4" />}
        {isSit ? "Se lever" : "S'asseoir"}
      </Button>
      <Button variant="outline" onPress={onMove} className={OUTLINE}>
        <Footprints className="size-4 text-amber-500 dark:text-amber-300" />
        Bouger
      </Button>
      <Button variant="outline" onPress={onStop} className={OUTLINE}>
        <Square className="size-3 fill-current" />
        Arrêter
      </Button>
      <Button
        onPress={onToggleRun}
        className={cn(BASE, "bg-foreground font-bold text-background hover:bg-foreground/85")}
      >
        {running ? <Pause className="size-4" /> : <Play className="size-4 fill-current" />}
        {running ? "Pause" : "Démarrer"}
      </Button>
    </div>
  );
}
