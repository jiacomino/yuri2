import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";

/**
 * Google OAuth 2.0 client ID for native loopback flow.
 *
 * Stored per-install in localStorage so the user can paste their own Desktop-app
 * Client ID from Google Cloud Console (console.cloud.google.com → APIs & Services
 * → Credentials → Create credentials → OAuth client ID → Application type:
 * Desktop app). No client secret is needed (PKCE handles that).
 */
const CLIENT_ID_KEY = "yuri.googleClientId";
const CLIENT_SECRET_KEY = "yuri.googleClientSecret";

const SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";

export function loadGoogleClientId(): string {
  try {
    return localStorage.getItem(CLIENT_ID_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function saveGoogleClientId(clientId: string): void {
  const trimmed = clientId.trim();
  if (trimmed) localStorage.setItem(CLIENT_ID_KEY, trimmed);
  else localStorage.removeItem(CLIENT_ID_KEY);
}

/**
 * Google's quirk: even for Desktop-app OAuth clients using PKCE, their token
 * endpoint requires the client_secret to be sent in the exchange request. The
 * secret isn't really secret for native apps (it ships in every install), so
 * we store it alongside the Client ID rather than treating it as sensitive.
 */
export function loadGoogleClientSecret(): string {
  try {
    return localStorage.getItem(CLIENT_SECRET_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function saveGoogleClientSecret(secret: string): void {
  const trimmed = secret.trim();
  if (trimmed) localStorage.setItem(CLIENT_SECRET_KEY, trimmed);
  else localStorage.removeItem(CLIENT_SECRET_KEY);
}

export type GoogleTokens = {
  accessToken: string;
  /** Present on first auth, absent on refresh — preserve the original. */
  refreshToken?: string;
  /** Epoch ms when accessToken expires. Refresh ~60s before. */
  expiresAt: number;
};

export type CalendarEvent = {
  id: string;
  /** Which calendar this event belongs to — used to look up the color. */
  calendarId: string;
  summary: string;
  /** ISO datetime when the event starts (timed events) or YYYY-MM-DD (all-day). */
  start: string;
  /** Same shape as start. */
  end: string;
  /** True for all-day events (date, no time component). */
  allDay: boolean;
  location?: string;
  htmlLink?: string;
  /** Google Meet / Hangouts URL when the event has a video conference attached. */
  videoLink?: string;
};

export type Calendar = {
  id: string;
  summary: string;
  /** Hex (e.g. "#4285f4"). Falls back to a neutral gray if Google omits it. */
  backgroundColor: string;
  primary: boolean;
};

export function isClientIdConfigured(): boolean {
  return loadGoogleClientId().length > 0 && loadGoogleClientSecret().length > 0;
}

// ─── PKCE helpers ────────────────────────────────────────────────────────────

function randomString(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  // Use unreserved URL chars only.
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += charset[bytes[i] % charset.length];
  }
  return out;
}

function base64UrlEncode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256(input: string): Promise<ArrayBuffer> {
  return await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
}

// ─── OAuth flow ──────────────────────────────────────────────────────────────

/**
 * Run the PKCE-protected loopback OAuth flow. Opens the user's browser,
 * waits for them to authorize, captures the code on a local TCP listener
 * spun up by the Rust side, then exchanges the code for tokens.
 */
export async function signInWithGoogle(): Promise<GoogleTokens> {
  const clientId = loadGoogleClientId();
  const clientSecret = loadGoogleClientSecret();
  if (!clientId || !clientSecret) {
    throw new Error(
      "Client ID ou Client Secret Google manquant. Renseigne-les dans le groupe Google Agenda (icône clé).",
    );
  }

  const verifier = randomString(64);
  const challenge = base64UrlEncode(await sha256(verifier));
  const state = randomString(32);

  // Reserve a loopback redirect URI before opening the browser.
  const { token, redirect_uri } = await invoke<{
    token: string;
    redirect_uri: string;
  }>("start_oauth_listener");

  const authUrl =
    `${AUTH_ENDPOINT}?` +
    new URLSearchParams({
      client_id: clientId,
      redirect_uri,
      response_type: "code",
      scope: SCOPE,
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
      access_type: "offline",
      prompt: "consent",
    }).toString();

  await openUrl(authUrl);

  const { code } = await invoke<{ code: string; state: string }>(
    "await_oauth_callback",
    { token, expectedState: state },
  );

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri,
    code_verifier: verifier,
  });
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    throw new Error(
      `Échec de l'échange du code OAuth : ${res.status} ${await res.text()}`,
    );
  }
  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
}

/**
 * Refresh an expired access token. Google does not return a new refresh
 * token, so the caller keeps the existing one.
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<Pick<GoogleTokens, "accessToken" | "expiresAt">> {
  const clientId = loadGoogleClientId();
  const clientSecret = loadGoogleClientSecret();
  if (!clientId || !clientSecret) {
    throw new Error(
      "Client ID ou Client Secret Google manquant. Reconfigure-les dans le groupe Google Agenda (icône clé).",
    );
  }
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    throw new Error(
      `Échec du refresh OAuth : ${res.status} ${await res.text()}`,
    );
  }
  const data = await res.json();
  return {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
}

/** Returns a fresh access token, refreshing if it's within 60s of expiry. */
export async function ensureFreshAccessToken(
  tokens: GoogleTokens,
): Promise<GoogleTokens> {
  if (Date.now() < tokens.expiresAt - 60_000) return tokens;
  if (!tokens.refreshToken) {
    throw new Error("Access token expiré et pas de refresh token disponible.");
  }
  const refreshed = await refreshAccessToken(tokens.refreshToken);
  return { ...tokens, ...refreshed };
}

// ─── Calendar API ────────────────────────────────────────────────────────────

/**
 * List every calendar the user has access to (own + subscribed + shared).
 * Used to populate the multi-calendar selector.
 */
export async function fetchCalendarList(
  accessToken: string,
): Promise<Calendar[]> {
  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) {
    throw new Error(
      `Échec récupération liste des calendriers : ${res.status} ${await res.text()}`,
    );
  }
  const data = await res.json();
  const items = Array.isArray(data.items) ? data.items : [];
  return items.map((it: Record<string, unknown>): Calendar => ({
    id: String(it.id ?? ""),
    summary: typeof it.summary === "string" ? it.summary : "(sans nom)",
    backgroundColor:
      typeof it.backgroundColor === "string" ? it.backgroundColor : "#9ca3af",
    primary: it.primary === true,
  }));
}

function parseEvent(
  it: Record<string, unknown>,
  calendarId: string,
): CalendarEvent {
  const start = it.start as { dateTime?: string; date?: string };
  const endRaw = it.end as { dateTime?: string; date?: string };
  const allDay = !!(start?.date && !start?.dateTime);
  // Meet link: prefer hangoutLink (legacy field, still populated), fall back
  // to conferenceData.entryPoints[].uri where entryPointType === "video".
  let videoLink: string | undefined;
  if (typeof it.hangoutLink === "string") {
    videoLink = it.hangoutLink;
  } else {
    const conf = it.conferenceData as
      | { entryPoints?: { entryPointType?: string; uri?: string }[] }
      | undefined;
    const video = conf?.entryPoints?.find((e) => e.entryPointType === "video");
    if (video?.uri) videoLink = video.uri;
  }
  return {
    id: String(it.id ?? ""),
    calendarId,
    summary: typeof it.summary === "string" ? it.summary : "(sans titre)",
    start: start?.dateTime ?? start?.date ?? "",
    end: endRaw?.dateTime ?? endRaw?.date ?? "",
    allDay,
    location: typeof it.location === "string" ? it.location : undefined,
    htmlLink: typeof it.htmlLink === "string" ? it.htmlLink : undefined,
    videoLink,
  };
}

/**
 * Fetch the next `daysAhead` of events across every calendar in
 * `calendarIds`, concurrently. Results are merged and sorted by start time;
 * the total is capped at `maxResults` after the merge so a single noisy
 * calendar can't crowd out the others.
 */
export async function fetchUpcomingEventsMulti(
  accessToken: string,
  calendarIds: string[],
  daysAhead: number,
  maxResults: number,
): Promise<CalendarEvent[]> {
  if (calendarIds.length === 0) return [];
  const now = new Date();
  const end = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    // Per-calendar cap; the merged list is re-clamped to maxResults below.
    maxResults: String(maxResults),
  });
  const lists = await Promise.all(
    calendarIds.map(async (calId) => {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events?${params}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!res.ok) {
        // Don't blow up the whole call if one calendar errors (e.g. revoked
        // access) — just skip it and let the rest render.
        console.warn(
          `Skipping calendar ${calId}: ${res.status} ${await res.text()}`,
        );
        return [];
      }
      const data = await res.json();
      const items = Array.isArray(data.items) ? data.items : [];
      return items.map((it: Record<string, unknown>) => parseEvent(it, calId));
    }),
  );
  const merged = lists.flat();
  merged.sort((a, b) => a.start.localeCompare(b.start));
  return merged.slice(0, maxResults);
}
