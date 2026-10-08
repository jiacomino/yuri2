import { AppWindow } from "lucide-react";
import { cn } from "@/lib/utils";

/** Icône d'application extraite par Windows, ou pictogramme générique. */
export function AppIcon({ src, className }: { src: string | null | undefined; className?: string }) {
  if (src) {
    return <img src={src} alt="" draggable={false} className={cn("size-8 shrink-0 object-contain", className)} />;
  }
  return (
    <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent", className)}>
      <AppWindow className="size-[60%]" />
    </span>
  );
}
