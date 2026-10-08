/** Liens yuri 1 (tables `tabs`/`items`, regroupées par l'import) → état yuri2. */
import { defaultState, type LinkItem, type LinksState } from "@/components/groups/links/state";
import { genId } from "@/lib/id";
import type { Converter } from "../types";
import { arr, isObj, obj, oneOf, str } from "./util";

export const convertLinks: Converter<LinksState> = (raw) => {
  const tabs = arr(obj(raw).tabs)
    .filter(isObj)
    .map((t) => ({
      id: str(t.id) || genId(),
      name: str(t.name) || "Liens",
      items: arr(t.items)
        .filter(isObj)
        .map((i): LinkItem => {
          const kind = oneOf(i.kind, ["link", "separator"] as const, "link");
          return { id: str(i.id) || genId(), kind, name: str(i.name), url: kind === "separator" ? "" : str(i.url) };
        }),
    }));
  return tabs.length > 0 ? { tabs } : defaultState();
};
