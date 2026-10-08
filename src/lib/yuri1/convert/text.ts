/**
 * Texte riche yuri 1 (HTML de contentEditable) → état yuri2 (HTML TipTap).
 * Les `<font color>` et fonds `background-color` de yuri 1 sont réécrits en
 * `<span style="color">` et `<mark>`, seules formes reconnues par TipTap.
 */
import { defaultState, type TextState, type TextTab } from "@/components/groups/text/state";
import { genId } from "@/lib/id";
import type { Converter } from "../types";
import { arr, isObj, str } from "./util";

function normalizeHtml(html: string): string {
  if (!html || typeof DOMParser === "undefined") return html;
  try {
    const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
    for (const font of Array.from(doc.body.querySelectorAll("font"))) {
      const span = doc.createElement("span");
      const color = font.getAttribute("color");
      if (color) span.style.color = color;
      span.append(...Array.from(font.childNodes));
      font.replaceWith(span);
    }
    for (const el of Array.from(doc.body.querySelectorAll<HTMLElement>("[style]"))) {
      const bg = el.style.backgroundColor;
      if (!bg || el.tagName === "MARK") continue;
      el.style.removeProperty("background-color");
      if (!el.getAttribute("style")) el.removeAttribute("style");
      const mark = doc.createElement("mark");
      mark.setAttribute("data-color", bg);
      mark.style.backgroundColor = bg;
      mark.append(...Array.from(el.childNodes));
      el.append(mark);
    }
    return doc.body.innerHTML;
  } catch {
    return html;
  }
}

export const convertText: Converter<TextState> = (raw) => {
  // Contenu non JSON : yuri 1 l'adoptait tel quel comme HTML d'un onglet unique.
  if (typeof raw === "string") {
    const id = genId();
    return raw ? { tabs: [{ id, name: "Note", content: normalizeHtml(raw) }], activeTabId: id } : defaultState();
  }
  if (!isObj(raw)) return defaultState();
  const tabs = arr(raw.tabs)
    .filter(isObj)
    .map((t): TextTab => ({ id: str(t.id) || genId(), name: str(t.name) || "Note", content: normalizeHtml(str(t.content)) }));
  if (tabs.length === 0) return defaultState();
  const active = str(raw.activeTabId);
  return { tabs, activeTabId: tabs.some((t) => t.id === active) ? active : tabs[0].id };
};
