import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ShieldCheck } from "lucide-react";
import { useContextMenuAnchor } from "@/components/shared/useContextMenuAnchor";
import { cn } from "@/lib/utils";
import { AppIcon } from "./AppIcon";
import { AppMenu, type AppMenuActions } from "./AppMenu";
import type { LaunchApp, LauncherView } from "./state";

type AppTileProps = AppMenuActions & {
  app: LaunchApp;
  view: LauncherView;
  /** Lancement en cours : retour visuel le temps que Windows réponde. */
  launching: boolean;
};

/** Application réordonnable (glisser) : clic = lancer, clic droit ou « … » = actions. */
export function AppTile({ app, view, launching, ...actions }: AppTileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: app.id });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnchor = useContextMenuAnchor(() => setMenuOpen(true));
  const detail = [app.path, app.args].filter(Boolean).join(" ");
  const grid = view === "grid";

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onContextMenu={menuAnchor.openAt}
      data-active={menuOpen}
      className={cn(
        "group/app relative",
        grid ? "list-card rounded-xl bg-surface" : "list-row flex items-center rounded-[10px] pr-1",
        isDragging && "z-10 opacity-40",
      )}
    >
      <div
        {...attributes}
        {...listeners}
        role="button"
        tabIndex={0}
        title={`${app.name}\n${detail}`}
        aria-label={`Lancer ${app.name}`}
        onClick={actions.onLaunch}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            actions.onLaunch();
          }
        }}
        className={cn(
          "flex min-w-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
          grid
            ? "flex-col items-center gap-1.5 rounded-xl px-1.5 pt-3 pb-2 text-center"
            : "flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5",
          launching && "animate-pulse",
        )}
      >
        <AppIcon src={app.icon} className={grid ? "size-9" : "size-6"} />
        <span
          className={cn(
            "min-w-0 font-semibold",
            grid ? "line-clamp-2 w-full text-[0.8889rem] leading-tight break-words" : "flex-1 truncate",
          )}
        >
          {app.name}
        </span>
        {!grid && (
          <span className="hidden max-w-[45%] shrink-0 truncate text-[0.8148rem] text-muted @[20rem]:inline">
            {detail}
          </span>
        )}
      </div>
      {app.admin && (
        <ShieldCheck
          aria-label="Lancée en administrateur"
          className={cn("size-3 shrink-0 text-warning", grid && "absolute top-1.5 left-1.5")}
        />
      )}
      <AppMenu
        name={app.name}
        isOpen={menuOpen}
        onOpenChange={(open) => {
          setMenuOpen(open);
          if (!open) menuAnchor.reset();
        }}
        anchorRef={menuAnchor.point ? menuAnchor.anchorRef : undefined}
        className={grid ? "absolute top-1 right-1" : undefined}
        {...actions}
      />
      {menuAnchor.anchor}
    </li>
  );
}
