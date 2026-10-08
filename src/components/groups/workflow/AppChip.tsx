import { cn } from "@/lib/utils";
import { chipClass } from "./priority";
import type { AppTag } from "./state";
import { Dot, tintStyle } from "./ui";

/** Pastille colorée d'une application, en lecture seule. */
export function AppBadge({ app, className }: { app: AppTag; className?: string }) {
  return (
    <span title={`Application : ${app.name}`} className={cn(chipClass, "max-w-full", className)} style={tintStyle(app.color)}>
      <Dot color={app.color} className="size-1.5" />
      <span className="truncate">{app.name}</span>
    </span>
  );
}

type AppChipProps = {
  app: AppTag;
  active: boolean;
  onPress: () => void;
  title?: string;
};

/** Pastille d'application cliquable (filtre ou sélection). */
export function AppChip({ app, active, onPress, title }: AppChipProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-pressed={active}
      title={title ?? app.name}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.8148rem] font-bold transition-all",
        active ? "ring-2 ring-accent/40" : "opacity-80 hover:opacity-100",
      )}
      style={tintStyle(app.color, active)}
    >
      <Dot color={app.color} className="size-1.5" />
      {app.name}
    </button>
  );
}
