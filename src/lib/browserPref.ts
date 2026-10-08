import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";

export type BrowserPref =
  | { kind: "default" }
  | { kind: "path"; name: string; path: string };

const KEY = "yuri.browserPref";

export function loadBrowserPref(): BrowserPref {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { kind: "default" };
    const parsed = JSON.parse(raw) as BrowserPref;
    if (parsed.kind === "default") return { kind: "default" };
    if (
      parsed.kind === "path" &&
      typeof parsed.path === "string" &&
      typeof parsed.name === "string"
    ) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return { kind: "default" };
}

export function saveBrowserPref(pref: BrowserPref): void {
  localStorage.setItem(KEY, JSON.stringify(pref));
}

export async function openWithPref(url: string): Promise<void> {
  const pref = loadBrowserPref();
  if (pref.kind === "default") {
    await openUrl(url);
    return;
  }
  await invoke("open_url_with", { path: pref.path, url });
}
