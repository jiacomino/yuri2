import type { GroupRecord } from "@/types/workspace";

/** Forme canonique d'un tag : minuscules, sans « # » initial, espaces → tirets. */
export function normalizeTag(raw: string): string {
  return raw.trim().replace(/^#+/, "").replace(/\s+/g, "-").toLowerCase();
}

/** Tags portés par des composants, avec leur nombre d'occurrences, triés par nom. */
export function tagCounts(groups: GroupRecord[]): { tag: string; count: number }[] {
  const map = new Map<string, number>();
  for (const g of groups) for (const t of g.tags) map.set(t, (map.get(t) ?? 0) + 1);
  return [...map]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => a.tag.localeCompare(b.tag, "fr"));
}
