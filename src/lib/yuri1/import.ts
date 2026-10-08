import { invoke } from "@tauri-apps/api/core";
import { findDefinition } from "@/components/groups/registry";
import type { GroupKind } from "@/components/groups/types";
import { db } from "@/lib/db";
import { genId } from "@/lib/id";
import type { GroupRecord } from "@/types/workspace";
import { converters } from "./convert";
import type { V1Data, V1Group } from "./types";

export type ImportReport = {
  path: string;
  workspaces: number;
  groups: number;
  /** Composants d'un type inconnu, ignorés. */
  skipped: string[];
  /** Composants dont le contenu n'a pas pu être converti (repartis de zéro). */
  reset: string[];
};

export function readYuri1(path?: string) {
  return invoke<V1Data>("read_yuri1_db", { path: path ?? null });
}

function parseJson(text: string): unknown {
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function parseTags(text: string): string[] {
  const v = parseJson(text);
  return Array.isArray(v) ? v.filter((t): t is string => typeof t === "string") : [];
}

/** Les liens de yuri 1 sont rangés dans les tables `tabs` et `items`, pas dans `content`. */
function rawState(group: V1Group, data: V1Data): unknown {
  if (group.kind !== "links") {
    const parsed = parseJson(group.content);
    // Anciens formats de yuri 1 : HTML ou Markdown brut, hors JSON.
    const plainText = group.kind === "text" || group.kind === "markdown";
    if (plainText && group.content.trim() && (typeof parsed !== "object" || parsed === null)) {
      return group.content;
    }
    return parsed;
  }
  return {
    tabs: data.tabs
      .filter((t) => t.groupId === group.id)
      .map((t) => ({
        id: t.id,
        name: t.name,
        items: data.items.filter((i) => i.tabId === t.id),
      })),
  };
}

/**
 * Copie les espaces et composants de yuri 1 dans yuri2. Tout est créé avec de
 * nouveaux identifiants : un second import ajoute des doublons sans rien écraser.
 */
export async function importYuri1(data: V1Data): Promise<ImportReport> {
  const report: ImportReport = { path: data.path, workspaces: 0, groups: 0, skipped: [], reset: [] };
  const workspaceIds = new Map<string, string>();

  for (const w of data.workspaces) {
    const created = await db.createWorkspace(w.name, w.color);
    workspaceIds.set(w.id, created.id);
    report.workspaces++;
  }

  for (const g of data.groups) {
    const def = findDefinition(g.kind as GroupKind);
    const workspaceId = workspaceIds.get(g.workspaceId);
    if (!def || !workspaceId) {
      report.skipped.push(`${g.name} (${g.kind})`);
      continue;
    }
    let state: unknown;
    try {
      const convert = converters[g.kind as GroupKind];
      state = convert ? convert(rawState(g, data)) : def.defaultState();
    } catch (err) {
      console.warn(`[yuri1] conversion de « ${g.name} » (${g.kind})`, err);
      state = def.defaultState();
      report.reset.push(`${g.name} (${g.kind})`);
    }
    const record: GroupRecord = {
      id: genId(),
      workspaceId,
      kind: def.kind,
      name: g.name,
      color: g.color,
      tags: parseTags(g.tags),
      x: g.x,
      y: g.y,
      w: g.w,
      h: g.h,
      minimized: g.minimized,
      state,
    };
    await db.upsertGroup(record);
    report.groups++;
  }

  return report;
}
