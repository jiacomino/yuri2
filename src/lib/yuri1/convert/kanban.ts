/**
 * Kanban yuri 1 → yuri2. Colonnes, cartes et applications conservées (ids compris) ;
 * priorité « normal » implicite (champ omis), `appId` orphelin retiré, couleur manquante complétée.
 */
import { APP_COLORS } from "@/components/groups/kanban/meta";
import {
  defaultKanbanState,
  newId,
  type AppTag,
  type CardPriority,
  type KanbanCard,
  type KanbanColumn,
  type KanbanState,
} from "@/components/groups/kanban/state";
import type { Converter } from "../types";
import { arr, isObj, obj, optStr, str } from "./util";

const PRIORITY_MAP: Record<string, CardPriority> = {
  urgent: "urgent",
  important: "important",
  high: "important",
  low: "low",
};

export const convertKanban: Converter<KanbanState> = (raw) => {
  const r = obj(raw);
  if (!Array.isArray(r.columns)) return defaultKanbanState();

  const apps: AppTag[] = arr(r.apps)
    .filter(isObj)
    .filter((a) => typeof a.id === "string" && typeof a.name === "string")
    .map((a, i) => ({ id: str(a.id), name: str(a.name), color: optStr(a.color) ?? APP_COLORS[i % APP_COLORS.length] }));
  const appIds = new Set(apps.map((a) => a.id));

  const columns: KanbanColumn[] = arr(r.columns)
    .filter(isObj)
    .map((c) => ({
      id: optStr(c.id) ?? newId(),
      name: str(c.name),
      cards: arr(c.cards)
        .filter(isObj)
        .filter((k) => typeof k.title === "string")
        .map((k) => {
          const card: KanbanCard = { id: optStr(k.id) ?? newId(), title: str(k.title) };
          const description = optStr(k.description);
          if (description) card.description = description;
          const priority = PRIORITY_MAP[str(k.priority)];
          if (priority) card.priority = priority;
          const appId = str(k.appId);
          if (appIds.has(appId)) card.appId = appId;
          return card;
        }),
    }));
  if (columns.length === 0) return defaultKanbanState();
  return { columns, apps };
};
