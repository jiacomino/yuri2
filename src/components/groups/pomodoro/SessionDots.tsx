import { cn } from "@/lib/utils";

type SessionDotsProps = {
  total: number;
  /** Sessions terminées dans le cycle courant. */
  done: number;
  /** Vrai pendant une session de travail (le segment suivant est « en cours »). */
  working: boolean;
};

/** Segments indiquant l'avancement dans le cycle de sessions. */
export function SessionDots({ total, done, working }: SessionDotsProps) {
  return (
    <div className="flex w-full items-center gap-1.5" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors",
            i < done
              ? "bg-rose-500 dark:bg-rose-400"
              : working && i === done
                ? "bg-rose-500/35 dark:bg-rose-400/35"
                : "bg-default",
          )}
        />
      ))}
    </div>
  );
}
