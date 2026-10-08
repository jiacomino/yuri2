import { useCallback, useEffect, useRef, useState } from "react";
import {
  ensureFreshAccessToken,
  fetchCalendarList,
  fetchUpcomingEventsMulti,
  signInWithGoogle,
  type CalendarEvent,
} from "@/lib/google";
import type { GCalendarState } from "./state";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const MAX_EVENTS = 50;

function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Connexion OAuth et synchronisation périodique (toutes les 5 min) des calendriers et
 * événements. Les mises à jour partent toujours de l'état le plus récent.
 */
export function useGoogleSync(value: GCalendarState, onChange: (next: GCalendarState) => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const update = useCallback((fn: (s: GCalendarState) => GCalendarState) => {
    valueRef.current = fn(valueRef.current);
    onChangeRef.current(valueRef.current);
  }, []);

  const refresh = useCallback(async () => {
    const s = valueRef.current;
    if (s.demo || !s.tokens) return;
    setLoading(true);
    setError(null);
    try {
      const fresh = await ensureFreshAccessToken(s.tokens);
      // La liste des calendriers est rafraîchie aussi : couleurs, ajouts, suppressions.
      const [calendars, events] = await Promise.all([
        fetchCalendarList(fresh.accessToken),
        s.selectedCalendarIds.length > 0
          ? fetchUpcomingEventsMulti(fresh.accessToken, s.selectedCalendarIds, s.daysAhead, MAX_EVENTS)
          : Promise.resolve<CalendarEvent[]>([]),
      ]);
      update((cur) => {
        if (!cur.tokens) return cur; // déconnecté entre-temps
        const valid = new Set(calendars.map((c) => c.id));
        return {
          ...cur,
          tokens: { ...cur.tokens, ...fresh },
          calendars,
          selectedCalendarIds: cur.selectedCalendarIds.filter((id) => valid.has(id)),
          events,
          syncedAt: Date.now(),
        };
      });
    } catch (err) {
      setError(message(err));
    } finally {
      setLoading(false);
    }
  }, [update]);

  // Synchronise à la connexion, au changement de réglages, puis périodiquement.
  const connected = !!value.tokens;
  useEffect(() => {
    if (!connected || value.demo) return;
    void refresh();
    const id = window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [connected, value.demo, value.tokens?.refreshToken, value.daysAhead, value.selectedCalendarIds.join("|"), refresh]);

  async function signIn() {
    setError(null);
    setLoading(true);
    try {
      const tokens = await signInWithGoogle();
      // Amorçage : sélectionne d'emblée le calendrier principal.
      const calendars = await fetchCalendarList(tokens.accessToken);
      const primary = calendars.find((c) => c.primary) ?? calendars[0];
      update((s) => ({ ...s, demo: undefined, tokens, calendars, selectedCalendarIds: primary ? [primary.id] : [] }));
    } catch (err) {
      setError(message(err));
    } finally {
      setLoading(false);
    }
  }

  function signOut() {
    setError(null);
    update((s) => ({
      ...s,
      demo: undefined,
      tokens: undefined,
      calendars: [],
      selectedCalendarIds: [],
      events: [],
      syncedAt: undefined,
    }));
  }

  return { loading, error, refresh, signIn, signOut, update };
}
