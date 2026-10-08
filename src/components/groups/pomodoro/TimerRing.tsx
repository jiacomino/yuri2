import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type TimerRingProps = {
  /** 0 → 1 */
  progress: number;
  /** Diamètre en px (diamètre maximal en mode `fluid`). */
  size?: number;
  stroke?: number;
  /** Classe `stroke-*` de l'arc de progression. */
  fillClass: string;
  /** Classe `stroke-*` de la piste. */
  trackClass: string;
  animate?: boolean;
  /**
   * L'anneau occupe la place disponible (largeur et hauteur) jusqu'à `size` px ; le
   * contenu centré peut suivre via les unités `cqw` (l'anneau est un conteneur).
   */
  fluid?: boolean;
  children?: ReactNode;
};

/** Anneau de progression circulaire avec un contenu centré (le temps restant). */
export function TimerRing({
  progress,
  size = 160,
  stroke = 8,
  fillClass,
  trackClass,
  animate,
  fluid,
  children,
}: TimerRingProps) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - progress);

  const ring = (
    <div
      className="@container relative aspect-square shrink-0"
      style={fluid ? { width: "min(100cqw, 100cqh)", maxWidth: size } : { width: size }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="block size-full -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className={trackClass} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className={cn(fillClass, "transition-[stroke-dashoffset]")}
          style={{ transitionDuration: animate ? "250ms" : "0ms" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">{children}</div>
    </div>
  );

  if (!fluid) return ring;

  // Zone de taille définie par le parent (flex-1) : l'anneau y prend le plus grand carré possible.
  return (
    <div className="flex max-h-[236px] min-h-28 w-full min-w-0 flex-1 items-center justify-center [container-type:size]">
      {ring}
    </div>
  );
}
