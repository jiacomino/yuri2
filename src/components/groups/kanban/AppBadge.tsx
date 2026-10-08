import { appChipStyle } from "./meta";
import type { AppTag } from "./state";

/** Pastille colorée identifiant l'application d'une carte. */
export function AppBadge({ app }: { app: Pick<AppTag, "name" | "color"> }) {
  return (
    <span
      title={`Application : ${app.name}`}
      className="inline-flex max-w-full items-center gap-1 truncate rounded-md px-2 py-0.5 text-[0.8148rem] font-bold"
      style={appChipStyle(app.color)}
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: app.color }} />
      <span className="truncate">{app.name}</span>
    </span>
  );
}
