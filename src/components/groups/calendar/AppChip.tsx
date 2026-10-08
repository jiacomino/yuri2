import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { AppTag } from "./state";

type AppChipProps = {
  app: Pick<AppTag, "name" | "color">;
  active?: boolean;
  /** Rend la pastille cliquable (filtre, sélection). */
  onPress?: () => void;
  title?: string;
  className?: string;
  children?: ReactNode;
};

/** Pastille teintée à la couleur d'une application. */
export function AppChip({ app, active, onPress, title, className, children }: AppChipProps) {
  const style = { color: app.color, backgroundColor: `${app.color}1f` };
  const content = (
    <>
      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: app.color }} />
      <span className="truncate">{app.name}</span>
      {children}
    </>
  );
  const base = "inline-flex max-w-40 shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.8889rem] font-semibold";
  if (!onPress) {
    return (
      <span title={title ?? app.name} className={cn(base, className)} style={style}>
        {content}
      </span>
    );
  }
  return (
    <button
      type="button"
      title={title ?? app.name}
      aria-pressed={active}
      onClick={onPress}
      className={cn(
        base,
        "cursor-pointer transition-all",
        active ? "ring-2 ring-current/40" : "opacity-70 hover:opacity-100",
        className,
      )}
      style={style}
    >
      {content}
    </button>
  );
}
