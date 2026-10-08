import type { ReactNode } from "react";
import { Button } from "@heroui/react";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";

type PomodoroControlsProps = {
  isRunning: boolean;
  isStarted: boolean;
  /** Désactive démarrer / réinitialiser (ex. aucune tâche active). */
  isDisabled?: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  /** Passe à la phase suivante ; bouton masqué si absent. */
  onSkip?: () => void;
  /** Bouton supplémentaire (réglages). */
  extra?: ReactNode;
};

/** Action principale : bouton plein sombre ; actions secondaires : contour. */
const PRIMARY = "h-10 rounded-xl bg-foreground px-5 font-bold text-background hover:bg-foreground/85";
const SECONDARY = "size-10 rounded-xl border-border bg-surface text-foreground/80 hover:bg-surface-secondary";

/** Démarrer / Pause / Réinitialiser / Phase suivante — partagé avec Pomo-tâches. */
export function PomodoroControls({
  isRunning,
  isStarted,
  isDisabled,
  onStart,
  onPause,
  onReset,
  onSkip,
  extra,
}: PomodoroControlsProps) {
  return (
    <div className="flex items-center gap-2">
      {isRunning ? (
        <Button className={PRIMARY} onPress={onPause}>
          <Pause className="size-4" />
          Pause
        </Button>
      ) : (
        <Button className={PRIMARY} onPress={onStart} isDisabled={isDisabled}>
          <Play className="size-4" />
          {isStarted ? "Reprendre" : "Démarrer"}
        </Button>
      )}
      <Button
        isIconOnly
        variant="outline"
        className={SECONDARY}
        aria-label="Réinitialiser"
        onPress={onReset}
        isDisabled={isDisabled}
      >
        <span title="Réinitialiser">
          <RotateCcw className="size-4" />
        </span>
      </Button>
      {onSkip && (
        <Button isIconOnly variant="outline" className={SECONDARY} aria-label="Phase suivante" onPress={onSkip}>
          <span title="Phase suivante">
            <SkipForward className="size-4" />
          </span>
        </Button>
      )}
      {extra}
    </div>
  );
}
