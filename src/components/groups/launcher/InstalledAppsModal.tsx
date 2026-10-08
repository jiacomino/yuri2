import { useEffect, useMemo, useState } from "react";
import { Button, Checkbox, Label, Modal, SearchField, Spinner } from "@heroui/react";
import { RefreshCw } from "lucide-react";
import { normalizeSearch } from "@/lib/search";
import { cn } from "@/lib/utils";
import { AppIcon } from "./AppIcon";
import { listStartMenuApps, listStoreApps, useIcons, type InstalledApp } from "./api";

type InstalledAppsModalProps = {
  isOpen: boolean;
  /** Chemins déjà présents dans le composant, proposés grisés. */
  existingPaths: Set<string>;
  onClose: () => void;
  onAdd: (apps: { name: string; path: string; icon: string }[]) => void;
};

/** Applications du menu Démarrer et du Microsoft Store, à cocher pour les ajouter. */
export function InstalledAppsModal({ isOpen, existingPaths, onClose, onAdd }: InstalledAppsModalProps) {
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container size="md" scroll="inside">
        <Modal.Dialog className="max-h-[80vh]">
          {isOpen && <Picker existingPaths={existingPaths} onClose={onClose} onAdd={onAdd} />}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function mergeApps(a: InstalledApp[], b: InstalledApp[]): InstalledApp[] {
  const seen = new Set(a.map((x) => x.name.toLowerCase()));
  return [...a, ...b.filter((x) => !seen.has(x.name.toLowerCase()))].sort((x, y) =>
    x.name.localeCompare(y.name, "fr", { sensitivity: "base" }),
  );
}

function Picker({ existingPaths, onClose, onAdd }: Omit<InstalledAppsModalProps, "isOpen">) {
  const [startMenu, setStartMenu] = useState<InstalledApp[] | null>(null);
  const [store, setStore] = useState<InstalledApp[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const force = refresh > 0;
    setStartMenu(null);
    setStore(null);
    setError(null);
    listStartMenuApps(force).then(
      (apps) => !cancelled && setStartMenu(apps),
      (err) => !cancelled && setError(String(err)),
    );
    void listStoreApps(force).then((apps) => !cancelled && setStore(apps));
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const all = useMemo(() => mergeApps(startMenu ?? [], store ?? []), [startMenu, store]);
  const needle = normalizeSearch(query.trim());
  const visible = needle
    ? all.filter((a) => normalizeSearch(`${a.name} ${a.folder}`).includes(needle))
    : all;
  const icons = useIcons(visible.map((a) => a.path));

  function toggle(path: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function submit() {
    onAdd(
      all
        .filter((a) => selected.has(a.path))
        .map((a) => ({ name: a.name, path: a.path, icon: icons.get(a.path) ?? "" })),
    );
    onClose();
  }

  return (
    <>
      <Modal.CloseTrigger />
      <Modal.Header>
        <Modal.Heading>Applications installées</Modal.Heading>
        <p className="text-xs text-muted">Cochez les applications à ajouter au lanceur.</p>
      </Modal.Header>
      <Modal.Body className="flex min-h-0 flex-col gap-2">
        <div className="flex shrink-0 items-center gap-1">
          <SearchField aria-label="Rechercher une application" value={query} onChange={setQuery} className="min-w-0 flex-1" autoFocus>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Rechercher…" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label="Actualiser la liste"
            isDisabled={startMenu === null || store === null}
            onPress={() => setRefresh((r) => r + 1)}
          >
            <RefreshCw className="size-3.5" />
          </Button>
        </div>

        {error ? (
          <p className="py-6 text-center text-[0.8889rem] text-danger">{error}</p>
        ) : startMenu === null ? (
          <div className="flex justify-center py-8">
            <Spinner size="sm" />
          </div>
        ) : (
          <ul className="m-0 flex min-h-0 flex-1 list-none flex-col gap-0.5 overflow-y-auto p-0">
            {visible.length === 0 && (
              <li className="py-6 text-center text-[0.8889rem] text-muted">Aucune application ne correspond.</li>
            )}
            {visible.map((app) => {
              const already = existingPaths.has(app.path);
              return (
                <li key={app.path}>
                  <Checkbox
                    isSelected={already || selected.has(app.path)}
                    isDisabled={already}
                    onChange={() => toggle(app.path)}
                    className={cn("w-full rounded-[10px] px-1.5 py-1", !already && "hover:bg-surface-secondary")}
                  >
                    <Checkbox.Content className="flex w-full items-center gap-2.5">
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <AppIcon src={icons.get(app.path)} className="size-6" />
                      <Label className="min-w-0 flex-1 truncate text-[0.9259rem]">{app.name}</Label>
                      <span className="max-w-[40%] shrink-0 truncate text-[0.8148rem] text-muted">
                        {already ? "Déjà ajoutée" : app.folder}
                      </span>
                    </Checkbox.Content>
                  </Checkbox>
                </li>
              );
            })}
          </ul>
        )}
        {startMenu !== null && store === null && (
          <p className="flex shrink-0 items-center gap-2 text-[0.8148rem] text-muted">
            <Spinner size="sm" /> Recherche des applications du Microsoft Store…
          </p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button size="sm" variant="secondary" onPress={onClose}>
          Annuler
        </Button>
        <Button size="sm" isDisabled={selected.size === 0} onPress={submit}>
          {selected.size > 1 ? `Ajouter (${selected.size})` : "Ajouter"}
        </Button>
      </Modal.Footer>
    </>
  );
}
