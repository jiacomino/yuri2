/**
 * Mots de passe yuri 1 → yuri2. Même forme `{ tabs, activeTabId }` ; l'ancien
 * format `{ entries }` (sans onglets) est rangé dans un onglet « Comptes ».
 */
import {
  defaultState,
  newId,
  type PasswordEntry,
  type PasswordState,
  type PasswordTab,
} from "@/components/groups/password/state";
import type { Converter } from "../types";
import { arr, isObj, obj, optStr, str } from "./util";

function uniqueById<T extends { id: string }>(list: T[]): T[] {
  const seen = new Set<string>();
  return list.filter((x) => !seen.has(x.id) && !!seen.add(x.id));
}

/** Objets portant un `id` et un `name` textuels. */
function named(v: unknown): Record<string, unknown>[] {
  return arr(v).filter((x): x is Record<string, unknown> => isObj(x) && typeof x.id === "string" && typeof x.name === "string");
}

function entries(v: unknown): PasswordEntry[] {
  return uniqueById(
    named(v).map((e) => {
      const url = optStr(e.url);
      return {
        id: e.id as string,
        name: e.name as string,
        username: str(e.username),
        password: str(e.password),
        ...(url ? { url } : {}),
      };
    }),
  );
}

export const convertPassword: Converter<PasswordState> = (raw) => {
  const r = obj(raw);
  const tabs: PasswordTab[] = uniqueById(
    named(r.tabs).map((t) => ({ id: t.id as string, name: t.name as string, entries: entries(t.entries) })),
  );
  if (tabs.length > 0) {
    const active = str(r.activeTabId);
    return { tabs, activeTabId: tabs.some((t) => t.id === active) ? active : tabs[0].id };
  }
  if (Array.isArray(r.entries)) {
    const id = newId();
    return { tabs: [{ id, name: "Comptes", entries: entries(r.entries) }], activeTabId: id };
  }
  return defaultState();
};
