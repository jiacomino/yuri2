import { useMemo, useState } from "react";
import { isClientIdConfigured } from "@/lib/google";
import type { BodyProps } from "../types";
import { AgendaFooter } from "./AgendaFooter";
import { AgendaList } from "./AgendaList";
import { CredentialsModal } from "./CredentialsModal";
import { ErrorBanner } from "./ErrorBanner";
import { SetupPanel } from "./SetupPanel";
import { SignInPanel } from "./SignInPanel";
import { MAX_DAYS, MIN_DAYS, type GCalendarState } from "./state";
import { useGoogleSync } from "./useGoogleSync";

/** Agenda Google : connexion OAuth, choix des calendriers, événements à venir. */
export function GCalendarBody({ value, onChange }: BodyProps<GCalendarState>) {
  const { loading, error, refresh, signIn, signOut, update } = useGoogleSync(value, onChange);
  const [configured, setConfigured] = useState(isClientIdConfigured);
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const recheck = () => setConfigured(isClientIdConfigured());

  const visibleEvents = useMemo(() => {
    const selected = new Set(value.selectedCalendarIds);
    return value.events.filter((e) => selected.has(e.calendarId));
  }, [value.events, value.selectedCalendarIds]);

  const connected = value.demo || !!value.tokens;

  function toggleCalendar(id: string) {
    update((s) => {
      const set = new Set(s.selectedCalendarIds);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...s, selectedCalendarIds: [...set] };
    });
  }

  let content;
  if (!configured && !value.demo) {
    content = <SetupPanel onSaved={recheck} />;
  } else if (!connected) {
    content = (
      <SignInPanel loading={loading} error={error} onSignIn={signIn} onEditCredentials={() => setCredentialsOpen(true)} />
    );
  } else {
    content = (
      <>
        <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-1">
          {error && (
            <div className="pt-1">
              <ErrorBanner message={error} />
            </div>
          )}
          <AgendaList
            events={visibleEvents}
            calendars={value.calendars}
            hasSelection={value.selectedCalendarIds.length > 0}
          />
        </div>
        <AgendaFooter
          daysAhead={value.daysAhead}
          onDaysAheadChange={(n) =>
            update((s) => ({ ...s, daysAhead: Math.max(MIN_DAYS, Math.min(MAX_DAYS, n)) }))
          }
          calendars={value.calendars}
          selectedIds={value.selectedCalendarIds}
          onToggleCalendar={toggleCalendar}
          syncedAt={value.syncedAt}
          loading={loading}
          onRefresh={() => void refresh()}
          onEditCredentials={() => setCredentialsOpen(true)}
          onSignOut={signOut}
        />
      </>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {content}
      <CredentialsModal isOpen={credentialsOpen} onClose={() => setCredentialsOpen(false)} onSaved={recheck} />
    </div>
  );
}
