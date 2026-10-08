import { findDefinition } from "@/components/groups/registry";
import type { GroupRecord } from "@/types/workspace";

/** Clés jamais indexées : identifiants, couleurs, dates, images et données sensibles. */
const SKIPPED_KEY = /^(id|.*Id|color|.*At|image|rendered|markerState)$|password|secret|token/i;

/** Minuscules sans accents, pour « tache » ≡ « Tâche ». */
export function normalizeSearch(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function collectText(value: unknown, out: string[]): void {
  if (typeof value === "string") {
    if (value.startsWith("data:")) return;
    // Contenu riche (HTML TipTap) : seul le texte compte.
    out.push(value.includes("<") ? value.replace(/<[^>]*>/g, " ") : value);
  } else if (Array.isArray(value)) {
    for (const v of value) collectText(v, out);
  } else if (value && typeof value === "object") {
    for (const [key, v] of Object.entries(value)) if (!SKIPPED_KEY.test(key)) collectText(v, out);
  }
}

// Les enregistrements sont remplacés à chaque modification : le cache se vide tout seul.
const haystacks = new WeakMap<GroupRecord, string>();

function haystack(group: GroupRecord): string {
  let text = haystacks.get(group);
  if (text === undefined) {
    const parts = [group.name, findDefinition(group.kind)?.label ?? "", ...group.tags];
    collectText(group.state, parts);
    text = normalizeSearch(parts.join("\n"));
    haystacks.set(group, text);
  }
  return text;
}

/**
 * Vrai si chaque mot de la requête apparaît dans le nom, le type, les tags ou le contenu
 * texte du composant.
 */
export function groupMatches(group: GroupRecord, query: string): boolean {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const text = haystack(group);
  return words.every((w) => text.includes(w));
}
