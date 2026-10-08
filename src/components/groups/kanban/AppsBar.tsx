import { Button, Chip, Popover } from "@heroui/react";
import { AppWindow } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppsEditor, type AppsEditorProps } from "./AppsEditor";
import { appChipStyle } from "./meta";

type AppsBarProps = AppsEditorProps & {
  /** Application filtrée (null = aucune). */
  filterAppId: string | null;
  onFilterChange: (appId: string | null) => void;
};

/** Bandeau au-dessus des colonnes : gestion des applications et filtre par application. */
export function AppsBar({ filterAppId, onFilterChange, ...editor }: AppsBarProps) {
  const { apps } = editor;

  return (
    <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto">
      <Popover>
        <Button size="sm" variant="secondary" className="h-7 shrink-0 gap-1.5 px-2.5 text-xs">
          <AppWindow className="size-3.5" />
          Applications
          {apps.length > 0 && (
            <Chip size="sm" variant="tertiary" className="tabular-nums">
              {apps.length}
            </Chip>
          )}
        </Button>
        <Popover.Content placement="bottom start">
          <Popover.Dialog className="p-0">
            <AppsEditor {...editor} />
          </Popover.Dialog>
        </Popover.Content>
      </Popover>

      {apps.length === 0 && (
        <span className="truncate text-xs text-muted">Créez des applications pour étiqueter et filtrer vos cartes.</span>
      )}
      {apps.map((app) => {
        const active = filterAppId === app.id;
        return (
          <button
            key={app.id}
            type="button"
            aria-pressed={active}
            title={active ? `Filtre actif : ${app.name}` : `Filtrer sur ${app.name}`}
            onClick={() => onFilterChange(active ? null : app.id)}
            style={appChipStyle(app.color)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[0.8148rem] font-bold transition-all",
              active ? "ring-2 ring-accent/50" : filterAppId ? "opacity-50 hover:opacity-100" : "hover:opacity-80",
            )}
          >
            <span className="size-1.5 rounded-full" style={{ backgroundColor: app.color }} />
            {app.name}
          </button>
        );
      })}
    </div>
  );
}
