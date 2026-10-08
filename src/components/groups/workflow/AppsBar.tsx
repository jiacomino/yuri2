import { Button, Popover } from "@heroui/react";
import { AppWindow } from "lucide-react";
import { AppChip } from "./AppChip";
import { AppsEditor } from "./AppsEditor";
import { useWorkflow } from "./context";

type AppsBarProps = {
  /** Application filtrée, `null` = pas de filtre. */
  activeAppId: string | null;
  onSelectApp: (appId: string | null) => void;
  onRemoveApp: (appId: string) => void;
};

/** Bandeau des applications : configuration (popover) et filtre par pastille. */
export function AppsBar({ activeAppId, onSelectApp, onRemoveApp }: AppsBarProps) {
  const { state } = useWorkflow();
  const apps = state.apps;

  return (
    <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto">
      <Popover>
        <Button size="sm" variant="secondary" aria-label="Configurer les applications" className="shrink-0">
          <AppWindow className="size-3.5" />
          Applications
          {apps.length > 0 && <span className="tabular-nums text-muted">{apps.length}</span>}
        </Button>
        <Popover.Content placement="bottom start">
          <Popover.Dialog className="p-0">
            <AppsEditor onRemove={onRemoveApp} />
          </Popover.Dialog>
        </Popover.Content>
      </Popover>

      {apps.length === 0 && (
        <span className="truncate text-xs text-muted">
          Aucune application — cliquez pour en créer et affecter vos actions.
        </span>
      )}
      {apps.map((app) => {
        const active = activeAppId === app.id;
        return (
          <AppChip
            key={app.id}
            app={app}
            active={active}
            title={active ? `Filtre actif : ${app.name}` : `Filtrer sur ${app.name}`}
            onPress={() => onSelectApp(active ? null : app.id)}
          />
        );
      })}
    </div>
  );
}
