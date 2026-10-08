import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { AlarmControl } from "@/components/shared/AlarmControl";
import { formatRelative } from "@/lib/alarm";
import { cn } from "@/lib/utils";

type PostItFooterProps = {
  text: string;
  alarmAt?: string;
  alarmFired: boolean;
  onAlarmChange: (alarmAt: string | undefined) => void;
};

/** Pied du post-it : cloche d'alarme, échéance relative et retrait rapide. */
export function PostItFooter({ text, alarmAt, alarmFired, onAlarmChange }: PostItFooterProps) {
  // Rafraîchit le libellé relatif (« dans 5 min ») toutes les 30 s.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!alarmAt) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, [alarmAt]);

  return (
    <div className="flex shrink-0 items-center gap-1.5 px-2 pb-2">
      <AlarmControl
        alarmAt={alarmAt}
        alarmFired={alarmFired}
        onChange={onAlarmChange}
        label={text.split("\n")[0]}
        className={cn(
          "size-7 min-w-7 rounded-lg hover:bg-[#713f12]/10 dark:hover:bg-yellow-100/10",
          !alarmFired && "text-[#713f12] dark:text-yellow-200",
        )}
      />
      {alarmAt ? (
        <span
          className={cn(
            "rounded-md px-2 py-0.5 text-[0.8148rem] font-bold tabular-nums",
            alarmFired
              ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
              : "bg-[#713f12]/12 text-[#713f12] dark:bg-yellow-100/10 dark:text-yellow-200",
          )}
        >
          {alarmFired ? "Sonné · " : ""}
          {formatRelative(alarmAt)}
        </span>
      ) : (
        <span className="text-[0.8889rem] font-medium text-[#713f12]/60 dark:text-yellow-100/50">Aucun rappel</span>
      )}
      <span className="flex-1" />
      {alarmAt && (
        <Button
          size="sm"
          variant="ghost"
          onPress={() => onAlarmChange(undefined)}
          className="h-7 rounded-lg px-2 text-[0.8889rem] font-semibold text-[#713f12]/70 hover:bg-[#713f12]/10 hover:text-[#713f12] dark:text-yellow-100/60 dark:hover:bg-yellow-100/10 dark:hover:text-yellow-100"
        >
          Retirer
        </Button>
      )}
    </div>
  );
}
