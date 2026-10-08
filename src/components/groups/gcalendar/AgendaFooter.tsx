import { Button } from "@heroui/react";
import { KeyRound, LogOut, Minus, Plus, RefreshCw } from "lucide-react";
import type { Calendar } from "@/lib/google";
import { formatRelative } from "@/lib/alarm";
import { cn } from "@/lib/utils";
import { CalendarPicker } from "./CalendarPicker";
import { MAX_DAYS, MIN_DAYS } from "./state";

type AgendaFooterProps = {
  daysAhead: number;
  onDaysAheadChange: (days: number) => void;
  calendars: Calendar[];
  selectedIds: string[];
  onToggleCalendar: (id: string) => void;
  syncedAt?: number;
  loading: boolean;
  onRefresh: () => void;
  onEditCredentials: () => void;
  onSignOut: () => void;
};

/** Barre du bas : fenêtre en jours, calendriers, synchro, identifiants, déconnexion. */
export function AgendaFooter(props: AgendaFooterProps) {
  const { daysAhead, onDaysAheadChange, syncedAt, loading } = props;
  return (
    <div className="mt-1 flex shrink-0 items-center gap-1 border-t border-separator pt-2.5 text-[0.8889rem] text-muted">
      <div className="flex shrink-0 items-center rounded-lg bg-default p-0.5" title="Nombre de jours affichés">
        <button
          type="button"
          aria-label="Un jour de moins"
          disabled={daysAhead <= MIN_DAYS}
          onClick={() => onDaysAheadChange(Math.max(MIN_DAYS, daysAhead - 1))}
          className="grid size-6 cursor-pointer place-items-center rounded-md hover:bg-surface hover:text-foreground disabled:cursor-default disabled:opacity-40"
        >
          <Minus className="size-3" />
        </button>
        <span className="min-w-9 text-center font-semibold text-foreground tabular-nums">{daysAhead} j</span>
        <button
          type="button"
          aria-label="Un jour de plus"
          disabled={daysAhead >= MAX_DAYS}
          onClick={() => onDaysAheadChange(Math.min(MAX_DAYS, daysAhead + 1))}
          className="grid size-6 cursor-pointer place-items-center rounded-md hover:bg-surface hover:text-foreground disabled:cursor-default disabled:opacity-40"
        >
          <Plus className="size-3" />
        </button>
      </div>
      <span className="min-w-0 flex-1 truncate pl-1 text-right" title="Dernière synchronisation">
        {syncedAt ? `Synchro ${formatRelative(new Date(syncedAt).toISOString())}` : ""}
      </span>
      <CalendarPicker calendars={props.calendars} selectedIds={props.selectedIds} onToggle={props.onToggleCalendar} />
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label="Rafraîchir les événements"
        onPress={props.onRefresh}
        isDisabled={loading}
        className="text-muted"
      >
        <RefreshCw className={cn("size-4", loading && "animate-spin")} />
      </Button>
      <Button isIconOnly size="sm" variant="ghost" aria-label="Identifiants OAuth" onPress={props.onEditCredentials} className="text-muted">
        <KeyRound className="size-4" />
      </Button>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label="Se déconnecter de Google"
        onPress={props.onSignOut}
        className="text-muted hover:text-danger"
      >
        <LogOut className="size-4" />
      </Button>
    </div>
  );
}
