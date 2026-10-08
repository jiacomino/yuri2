/** Markdown yuri 1 (onglets, ou ancien format `{ text, mode }`) → état yuri2. */
import { defaultState, type MarkdownState, type MarkdownTab } from "@/components/groups/markdown/state";
import { genId } from "@/lib/id";
import type { Converter } from "../types";
import { arr, isObj, oneOf, str } from "./util";

const MODES = ["edit", "split", "preview"] as const;

export const convertMarkdown: Converter<MarkdownState> = (raw) => {
  // Contenu non JSON : yuri 1 l'adoptait tel quel comme texte Markdown.
  if (typeof raw === "string") {
    const id = genId();
    return raw ? { tabs: [{ id, name: "Note", text: raw }], activeTabId: id, mode: "preview" } : defaultState();
  }
  if (!isObj(raw)) return defaultState();
  const mode = oneOf(raw.mode, MODES, "edit");
  const tabs = arr(raw.tabs)
    .filter(isObj)
    .map((t): MarkdownTab => ({ id: str(t.id) || genId(), name: str(t.name) || "Note", text: str(t.text) }));
  if (tabs.length > 0) {
    const active = str(raw.activeTabId);
    return { tabs, activeTabId: tabs.some((t) => t.id === active) ? active : tabs[0].id, mode };
  }
  if (typeof raw.text === "string") {
    const id = genId();
    return { tabs: [{ id, name: "Note", text: raw.text }], activeTabId: id, mode };
  }
  return defaultState();
};
