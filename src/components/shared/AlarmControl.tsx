import { useState } from "react";
import { Button, Popover } from "@heroui/react";
import { Bell, BellOff, BellRing } from "lucide-react";
import {
  fireAlarmNotification,
  formatRelative,
  fromDatetimeLocal,
  requestNotificationPermission,
  toDatetimeLocal,
} from "@/lib/alarm";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";

type AlarmControlProps = {
  alarmAt?: string;
  alarmFired?: boolean;
  /** `undefined` retire l'alarme. */
  onChange: (alarmAt: string | undefined) => void;
  /** Libellé repris dans la notification de confirmation. */
  label?: string;
  className?: string;
};

function formatWhen(iso: string): string {
  const dt = new Date(iso);
  const time = dt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const date = dt.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
  return `${date} à ${time}`;
}

/** Bouton cloche + popover de réglage d'une alarme (date et heure). */
export function AlarmControl({ alarmAt, alarmFired, onChange, label, className }: AlarmControlProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(toDatetimeLocal(alarmAt));

  const hasAlarm = !!alarmAt;
  const fired = !!alarmFired;
  const Icon = fired ? BellRing : hasAlarm ? Bell : BellOff;

  function handleOpenChange(next: boolean) {
    if (next) setDraft(toDatetimeLocal(alarmAt));
    setOpen(next);
  }

  function apply() {
    const iso = fromDatetimeLocal(draft);
    onChange(iso);
    if (iso) {
      const trimmed = label?.trim();
      const body = trimmed ? `${formatWhen(iso)} — ${trimmed}` : formatWhen(iso);
      notify({ title: "Alarme programmée", body, kind: "success", durationMs: 4000 });
      void (async () => {
        await requestNotificationPermission();
        await fireAlarmNotification("Alarme programmée", body);
      })();
    }
    setOpen(false);
  }

  function clear() {
    onChange(undefined);
    setDraft("");
    setOpen(false);
  }

  const title = alarmAt
    ? `${fired ? "Sonné" : "Programmé"} : ${formatWhen(alarmAt)} (${formatRelative(alarmAt)})`
    : "Définir une alarme";

  return (
    <Popover isOpen={open} onOpenChange={handleOpenChange}>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label={hasAlarm ? "Modifier l'alarme" : "Définir une alarme"}
        className={cn(
          fired ? "text-danger" : hasAlarm ? "text-warning" : "text-muted",
          fired && "animate-pulse",
          className,
        )}
      >
        <span title={title}>
          <Icon className="size-3.5" />
        </span>
      </Button>
      <Popover.Content placement="bottom end">
        <Popover.Dialog className="flex min-w-64 flex-col gap-2 p-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-medium text-muted">Alarme</span>
            {alarmAt && (
              <span className={cn("text-xs tabular-nums", fired ? "font-semibold text-danger" : "text-muted")}>
                {fired ? "Sonné · " : ""}
                {formatRelative(alarmAt)}
              </span>
            )}
          </div>
          <input
            type="datetime-local"
            value={draft}
            onChange={(e) => setDraft(e.currentTarget.value)}
            autoFocus
            className="h-8 rounded-xl border border-border bg-surface px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          />
          <div className="flex items-center gap-1.5">
            {hasAlarm && (
              <Button size="sm" variant="ghost" onPress={clear}>
                Retirer
              </Button>
            )}
            <span className="flex-1" />
            <Button size="sm" variant="secondary" onPress={() => setOpen(false)}>
              Annuler
            </Button>
            <Button size="sm" variant="primary" onPress={apply} isDisabled={!draft}>
              Valider
            </Button>
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
