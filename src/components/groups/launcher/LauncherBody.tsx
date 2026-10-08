import { useMemo, useRef, useState } from "react";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { Button, Dropdown, Label, SearchField, ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { AppWindow, FolderOpen, LayoutGrid, List, PenLine, Plus, Rocket, Upload } from "lucide-react";
import { useFileDrop } from "@/components/shared/useFileDrop";
import { notify } from "@/lib/notify";
import { normalizeSearch } from "@/lib/search";
import { cn } from "@/lib/utils";
import type { BodyProps } from "../types";
import { fetchIcons, launchApp } from "./api";
import { AppDialog, pickProgram, type AppDialogTarget, type AppDraft } from "./AppDialog";
import { AppTile } from "./AppTile";
import { InstalledAppsModal } from "./InstalledAppsModal";
import { isFilePath, nameFromPath, newApp, type LaunchApp, type LauncherState, type LauncherView } from "./state";

/**
 * Corps du groupe « Lanceur » : applications Windows à lancer d'un clic, ajoutées depuis le
 * menu Démarrer, un fichier ou un chemin saisi, réordonnables par glisser-déposer.
 */
export function LauncherBody({ value, onChange }: BodyProps<LauncherState>) {
  // Les mises à jour arrivent aussi après un `await` (icônes, lancement) : partir du dernier état.
  const valueRef = useRef(value);
  valueRef.current = value;
  function update(fn: (s: LauncherState) => LauncherState) {
    valueRef.current = fn(valueRef.current);
    onChange(valueRef.current);
  }
  function patchApp(id: string, patch: Partial<LaunchApp>) {
    update((s) => ({ ...s, apps: s.apps.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
  }

  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<AppDialogTarget | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [launching, setLaunching] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const needle = normalizeSearch(query.trim());
  const apps = needle
    ? value.apps.filter((a) => normalizeSearch(`${a.name} ${a.path}`).includes(needle))
    : value.apps;
  const existingPaths = useMemo(() => new Set(value.apps.map((a) => a.path)), [value.apps]);

  async function launch(app: LaunchApp, forceAdmin = false) {
    setLaunching(app.id);
    try {
      await launchApp({ ...app, admin: app.admin || forceAdmin });
      update((s) => ({
        ...s,
        apps: s.apps.map((a) => (a.id === app.id ? { ...a, launchCount: a.launchCount + 1, lastLaunchedAt: Date.now() } : a)),
      }));
    } catch (err) {
      notify({ title: `Impossible de lancer « ${app.name} »`, body: String(err), kind: "alarm", durationMs: 6000 });
    } finally {
      setLaunching(null);
    }
  }

  async function addApps(items: { name: string; path: string; icon: string }[]) {
    const added = items.map((i) => newApp(i.name, i.path, i.icon));
    update((s) => ({ ...s, apps: [...s.apps, ...added] }));
    // Icônes pas encore chargées dans la liste (hors de l'écran) : complétées ensuite.
    const missing = added.filter((a) => !a.icon);
    if (missing.length === 0) return;
    const icons = await fetchIcons(missing.map((a) => a.path)).catch(() => []);
    missing.forEach((a, i) => icons[i] && patchApp(a.id, { icon: icons[i] }));
  }

  /** Fichiers déposés depuis l'Explorateur : ajoutés tels quels, sauf ceux déjà présents. */
  function addDropped(paths: string[]) {
    const known = new Set(valueRef.current.apps.map((a) => a.path.toLowerCase()));
    const fresh = paths.filter((p) => !known.has(p.toLowerCase()));
    if (fresh.length < paths.length) {
      notify({ title: `${paths.length - fresh.length} application(s) déjà présente(s), ignorée(s)`, durationMs: 3000 });
    }
    if (fresh.length > 0) void addApps(fresh.map((path) => ({ name: nameFromPath(path), path, icon: "" })));
  }

  const rootRef = useRef<HTMLDivElement>(null);
  const dropping = useFileDrop(rootRef, addDropped);

  async function browse() {
    const path = await pickProgram();
    if (path) setDialog({ mode: "add", path });
  }

  function saveDraft(draft: AppDraft) {
    if (dialog?.mode === "edit") patchApp(dialog.app.id, draft);
    else update((s) => ({ ...s, apps: [...s.apps, { ...newApp(draft.name, draft.path), ...draft }] }));
  }

  async function reveal(app: LaunchApp) {
    try {
      await revealItemInDir(app.path);
    } catch (err) {
      notify({ title: "Emplacement introuvable", body: String(err), kind: "alarm", durationMs: 6000 });
    }
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    update((s) => {
      const from = s.apps.findIndex((a) => a.id === active.id);
      const to = s.apps.findIndex((a) => a.id === over.id);
      return from < 0 || to < 0 ? s : { ...s, apps: arrayMove(s.apps, from, to) };
    });
  }

  const grid = value.view === "grid";

  return (
    <div ref={rootRef} className="relative flex h-full min-h-0 flex-col gap-2">
      {dropping && (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-accent bg-accent/10 text-accent backdrop-blur-[1px]">
          <Upload className="size-6" />
          <span className="text-[0.963rem] font-semibold">Déposer pour ajouter au lanceur</span>
        </div>
      )}
      <div className="flex shrink-0 items-center gap-1">
        <SearchField aria-label="Filtrer les applications" value={query} onChange={setQuery} className="min-w-0 flex-1">
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Filtrer…" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
        <ViewSwitch view={value.view} onChange={(view) => update((s) => ({ ...s, view }))} />
        <AddMenu onInstalled={() => setPickerOpen(true)} onBrowse={() => void browse()} onManual={() => setDialog({ mode: "add" })} />
      </div>

      <div className="@container min-h-0 flex-1 overflow-y-auto">
        {value.apps.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <span className="grid size-10 place-items-center rounded-xl bg-accent/10 text-accent">
              <Rocket className="size-5" />
            </span>
            <p className="text-[0.8889rem] text-muted">
              Aucune application pour l'instant.
              <br />
              Glissez ici un programme ou un raccourci depuis l'Explorateur, ou :
            </p>
            <Button size="sm" variant="secondary" onPress={() => setPickerOpen(true)}>
              <AppWindow className="size-3.5" />
              Choisir parmi les applications installées
            </Button>
          </div>
        ) : apps.length === 0 ? (
          <p className="py-6 text-center text-[0.8889rem] text-muted">Aucune application ne correspond.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={apps.map((a) => a.id)} strategy={grid ? rectSortingStrategy : verticalListSortingStrategy}>
              <ul
                className={cn(
                  "m-0 list-none p-1",
                  grid ? "grid grid-cols-[repeat(auto-fill,minmax(5.75rem,1fr))] gap-1.5" : "flex flex-col gap-0.5",
                )}
              >
                {apps.map((app) => (
                  <AppTile
                    key={app.id}
                    app={app}
                    view={value.view}
                    launching={launching === app.id}
                    onLaunch={() => void launch(app)}
                    onLaunchAdmin={() => void launch(app, true)}
                    onReveal={isFilePath(app.path) ? () => void reveal(app) : undefined}
                    onEdit={() => setDialog({ mode: "edit", app })}
                    onRemove={() => update((s) => ({ ...s, apps: s.apps.filter((a) => a.id !== app.id) }))}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <AppDialog target={dialog} onClose={() => setDialog(null)} onSubmit={saveDraft} />
      <InstalledAppsModal
        isOpen={pickerOpen}
        existingPaths={existingPaths}
        onClose={() => setPickerOpen(false)}
        onAdd={(items) => void addApps(items)}
      />
    </div>
  );
}

function ViewSwitch({ view, onChange }: { view: LauncherView; onChange: (view: LauncherView) => void }) {
  return (
    <ToggleButtonGroup
      size="sm"
      isDetached
      className="gap-0.5"
      aria-label="Affichage"
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[view]}
      onSelectionChange={(keys) => {
        const next = [...keys][0];
        if (next) onChange(next as LauncherView);
      }}
    >
      {(
        [
          { id: "grid", label: "Grille", icon: LayoutGrid },
          { id: "list", label: "Liste", icon: List },
        ] as const
      ).map(({ id, label, icon: Icon }) => (
        <ToggleButton
          key={id}
          id={id}
          isIconOnly
          variant="ghost"
          aria-label={label}
          className="size-7 min-w-7 rounded-lg text-muted hover:text-foreground data-[selected=true]:bg-surface-secondary data-[selected=true]:text-accent"
        >
          <Icon className="size-3.5" />
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

type AddMenuProps = { onInstalled: () => void; onBrowse: () => void; onManual: () => void };

function AddMenu({ onInstalled, onBrowse, onManual }: AddMenuProps) {
  return (
    <Dropdown>
      <Button isIconOnly size="sm" variant="ghost" aria-label="Ajouter une application">
        <Plus className="size-4" />
      </Button>
      <Dropdown.Popover placement="bottom end">
        <Dropdown.Menu
          onAction={(key) => {
            if (key === "installed") onInstalled();
            else if (key === "browse") onBrowse();
            else if (key === "manual") onManual();
          }}
        >
          <Dropdown.Item id="installed" textValue="Applications installées">
            <AppWindow className="size-3.5" />
            <Label>Applications installées…</Label>
          </Dropdown.Item>
          <Dropdown.Item id="browse" textValue="Parcourir">
            <FolderOpen className="size-3.5" />
            <Label>Choisir un fichier…</Label>
          </Dropdown.Item>
          <Dropdown.Item id="manual" textValue="Saisir un chemin">
            <PenLine className="size-3.5" />
            <Label>Saisir un chemin ou une commande…</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
