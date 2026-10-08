import { genId } from "@/lib/id";

/** Élément copié, tel que remonté par la surveillance Rust (`clipboard-changed`). */
export type Clip = { kind: "text"; text: string } | { kind: "image"; dataUrl: string; width: number; height: number };

export type ClipItem = Clip & {
  id: string;
  /** Date ISO de la (dernière) copie. */
  at: string;
  /** Épinglé : jamais retiré par la limite ni par « Vider ». */
  pinned?: boolean;
};

export type ClipboardState = {
  items: ClipItem[];
  /** En pause, les nouvelles copies ne sont pas enregistrées. */
  paused: boolean;
};

/** Éléments non épinglés conservés au plus. */
export const MAX_ITEMS = 50;
/** Images non épinglées conservées au plus (elles pèsent lourd dans la base). */
export const MAX_IMAGES = 12;

export function defaultState(): ClipboardState {
  return { items: [], paused: false };
}

export function demoState(): ClipboardState {
  const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();
  return {
    paused: false,
    items: [
      { id: "c1", kind: "text", text: "https://github.com/tauri-apps/tauri/releases", at: ago(2) },
      { id: "c2", kind: "text", text: "Réunion décalée à jeudi 14 h, salle Atlas.", at: ago(9), pinned: true },
      { id: "c3", kind: "text", text: "npm run tauri build -- --no-bundle", at: ago(26) },
      { id: "c4", kind: "text", text: "marie.dupont@example.fr", at: ago(64) },
    ],
  };
}

function sameContent(a: Clip, b: Clip): boolean {
  if (a.kind === "text" && b.kind === "text") return a.text === b.text;
  if (a.kind === "image" && b.kind === "image") return a.dataUrl === b.dataUrl;
  return false;
}

/**
 * Ajoute une copie en tête. Un contenu déjà présent remonte en tête (en gardant son
 * épinglage) au lieu d'être dupliqué. Les limites ne s'appliquent qu'aux non-épinglés.
 */
export function recordClip(state: ClipboardState, clip: Clip): ClipboardState {
  if (state.paused) return state;
  const existing = state.items.find((i) => sameContent(i, clip));
  const item: ClipItem = {
    ...clip,
    id: existing?.id ?? genId(),
    at: new Date().toISOString(),
    pinned: existing?.pinned,
  };
  let unpinned = 0;
  let images = 0;
  const kept = [item, ...state.items.filter((i) => i !== existing)].filter((i) => {
    if (i.pinned) return true;
    if (i.kind === "image" && ++images > MAX_IMAGES) return false;
    return ++unpinned <= MAX_ITEMS;
  });
  return { ...state, items: kept };
}

/** Courte description d'un élément (aperçu, recherche). */
export function clipLabel(item: ClipItem): string {
  return item.kind === "text" ? item.text : `Image ${item.width} × ${item.height}`;
}
