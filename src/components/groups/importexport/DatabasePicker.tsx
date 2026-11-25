import { useMemo, useState } from "react";
import { Button, Checkbox } from "@heroui/react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search, X } from "lucide-react";
import { formatBytes, type DbInfo } from "@/lib/importExport";
import { cn } from "@/lib/utils";

type SortKey = "name" | "tables" | "rows" | "size";
const SYSTEM = ["information_schema", "performance_schema", "mysql", "sys"];

const COLUMNS: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: "name", label: "Base" },
  { key: "tables", label: "Tables", numeric: true },
  { key: "rows", label: "Lignes (≈)", numeric: true },
  { key: "size", label: "Taille", numeric: true },
];

/** Bases du serveur : filtre par nom, tri par colonne, sélection par cases à cocher. */
export function DatabasePicker({
  databases,
  selected,
  onChange,
}: {
  databases: DbInfo[];
  selected: string[];
  onChange: (names: string[]) => void;
}) {
  const [filter, setFilter] = useState("");
  const [showSystem, setShowSystem] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "name", dir: 1 });

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return databases
      .filter((d) => showSystem || !SYSTEM.includes(d.name))
      .filter((d) => !q || d.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const v = sort.key === "name" ? a.name.localeCompare(b.name) : a[sort.key] - b[sort.key];
        return v * sort.dir || a.name.localeCompare(b.name);
      });
  }, [databases, filter, showSystem, sort]);

  const set = new Set(selected);
  const allVisibleSelected = rows.length > 0 && rows.every((r) => set.has(r.name));
  const hidden = databases.length - rows.length;

  function toggle(name: string, on: boolean) {
    onChange(on ? [...selected, name] : selected.filter((s) => s !== name));
  }

  function toggleVisible(on: boolean) {
    const names = rows.map((r) => r.name);
    onChange(on ? [...new Set([...selected, ...names])] : selected.filter((s) => !names.includes(s)));
  }

  function sortBy(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === "name" ? 1 : -1 }));
  }

  return (
    <div className="flex flex-col gap-2 rounded-[12px] ring-1 ring-border">
      <div className="flex items-center gap-2 px-2 pt-2">
        <div className="flex h-8 flex-1 items-center gap-1.5 rounded-[9px] bg-surface-secondary px-2.5 focus-within:ring-2 focus-within:ring-accent/40">
          <Search className="size-3.5 text-muted" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.currentTarget.value)}
            placeholder="Filtrer par nom…"
            aria-label="Filtrer les bases"
            autoFocus
            className="min-w-0 flex-1 bg-transparent text-[0.963rem] outline-none placeholder:text-muted"
          />
          {filter && (
            <button type="button" aria-label="Effacer le filtre" onClick={() => setFilter("")} className="text-muted hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <label className="flex items-center gap-1.5 text-[0.8889rem] text-muted">
          <input type="checkbox" checked={showSystem} onChange={(e) => setShowSystem(e.currentTarget.checked)} />
          Bases système
        </label>
        {selected.length > 0 && (
          <Button size="sm" variant="ghost" onPress={() => onChange([])}>
            Tout désélectionner
          </Button>
        )}
      </div>

      <div className="max-h-72 overflow-y-auto">
        <table className="w-full text-[0.8889rem]">
          <thead className="sticky top-0 z-10 bg-surface text-left text-[0.7407rem] tracking-[0.08em] text-muted uppercase">
            <tr>
              <th className="w-9 px-2 py-1.5">
                <Checkbox
                  aria-label="Sélectionner les bases affichées"
                  isSelected={allVisibleSelected}
                  isIndeterminate={!allVisibleSelected && rows.some((r) => set.has(r.name))}
                  onChange={toggleVisible}
                >
                  <Checkbox.Content>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                  </Checkbox.Content>
                </Checkbox>
              </th>
              {COLUMNS.map((col) => (
                <th key={col.key} className={cn("px-2 py-1.5 font-bold", col.numeric && "text-right")}>
                  <button
                    type="button"
                    onClick={() => sortBy(col.key)}
                    className={cn("inline-flex items-center gap-1 uppercase hover:text-foreground", sort.key === col.key && "text-foreground")}
                  >
                    {col.label}
                    {sort.key !== col.key ? (
                      <ArrowUpDown className="size-3 opacity-50" />
                    ) : sort.dir === 1 ? (
                      <ArrowUp className="size-3" />
                    ) : (
                      <ArrowDown className="size-3" />
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => {
              const on = set.has(d.name);
              return (
                <tr
                  key={d.name}
                  onClick={() => toggle(d.name, !on)}
                  className={cn("cursor-pointer border-t border-separator transition-colors", on ? "bg-accent/8" : "hover:bg-surface-secondary")}
                >
                  <td className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                    <Checkbox aria-label={`Sélectionner ${d.name}`} isSelected={on} onChange={(v) => toggle(d.name, v)}>
                      <Checkbox.Content>
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                      </Checkbox.Content>
                    </Checkbox>
                  </td>
                  <td className="px-2 py-1.5 font-mono">{d.name}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{d.tables}</td>
                  <td className={cn("px-2 py-1.5 text-right tabular-nums", d.tables > 0 && d.rows === 0 && "text-warning")}>
                    {d.rows.toLocaleString("fr-FR")}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{formatBytes(d.size)}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-2 py-6 text-center text-muted">
                  Aucune base ne correspond.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="px-3 pb-2 text-[0.8148rem] text-muted">
        {selected.length} sélectionnée(s) · {rows.length} affichée(s){hidden > 0 && ` · ${hidden} masquée(s)`}. Le nombre de lignes est une estimation (InnoDB).
      </p>
    </div>
  );
}
