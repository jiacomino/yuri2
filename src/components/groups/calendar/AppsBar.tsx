import { Button, Popover } from "@heroui/react";
import { AppWindow } from "lucide-react";
import { AppChip } from "./AppChip";
import { AppsManager } from "./AppsManager";
import type { AppTag } from "./state";

type AppsBarProps = {
  apps: AppTag[];
  activeAppId: string | null;
  onSelectApp: (appId: string | null) => void;
  onAdd: (name: string, color: string) => void;
  onUpdate: (appId: string, patch: Partial<Omit<AppTag, "id">>) => void;
  onRemove: (appId: string) => void;
};

/** Bandeau des applications : bouton de gestion + pastilles servant de filtre. */
export function AppsBar({ apps, activeAppId, onSelectApp, onAdd, onUpdate, onRemove }: AppsBarProps) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto pb-2">
      <Popover>
        <Button size="sm" variant="outline" className="h-7 shrink-0 rounded-full border-border px-3 text-[0.8889rem] font-semibold">
          <AppWindow className="size-3.5" />
          Applications
          {apps.length > 0 && <span className="text-muted tabular-nums">{apps.length}</span>}
        </Button>
        <Popover.Content placement="bottom start">
          <Popover.Dialog className="p-3">
            <AppsManager apps={apps} onAdd={onAdd} onUpdate={onUpdate} onRemove={onRemove} />
          </Popover.Dialog>
        </Popover.Content>
      </Popover>

      {apps.length === 0 ? (
        <span className="truncate text-[0.8889rem] text-muted">
          Aucune application — créez-en pour classer et filtrer vos tâches.
        </span>
      ) : (
        apps.map((app) => {
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
        })
      )}
    </div>
  );
}
