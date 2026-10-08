export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function faviconFor(url: string): string {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
  } catch {
    return "";
  }
}

export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export type UrlValidation =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Validates an http(s) URL. Adds `https://` if scheme is missing.
 * Rejects non-http(s) protocols, missing or incomplete host names.
 */
export function validateUrl(input: string): UrlValidation {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "URL requise." };

  const normalized = /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return { ok: false, error: "URL invalide." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      ok: false,
      error: "Le lien doit utiliser http:// ou https://.",
    };
  }

  if (!parsed.hostname) {
    return { ok: false, error: "Nom de domaine manquant." };
  }

  if (!parsed.hostname.includes(".") && parsed.hostname !== "localhost") {
    return {
      ok: false,
      error: "Nom de domaine incomplet (ex : exemple.com).",
    };
  }

  return { ok: true, url: parsed.toString() };
}
