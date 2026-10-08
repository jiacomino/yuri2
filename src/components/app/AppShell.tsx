import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { Spinner } from "@heroui/react";
import { AddGroupDialog } from "@/components/add/AddGroupDialog";
import { EmptyWorkspace } from "@/components/canvas/EmptyWorkspace";
import { GroupCanvas } from "@/components/canvas/GroupCanvas";
import { MinimizedDock } from "@/components/canvas/MinimizedDock";
import { GroupSettingsDialog, type GroupSettings } from "@/components/group/GroupSettingsDialog";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import type { GroupKind } from "@/components/groups/types";
import { WorkspaceDialog, type WorkspaceDialogTarget } from "@/components/workspace/WorkspaceDialog";
import { WorkspaceTabs } from "@/components/workspace/WorkspaceTabs";
import { useGroups } from "@/hooks/useGroups";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { confirmDelete } from "@/lib/confirm";
import { groupMatches } from "@/lib/search";
import { invoke } from "@tauri-apps/api/core";
import { arrangeInRows } from "@/lib/arrange";
import { notify } from "@/lib/notify";
import { tagCounts } from "@/lib/tags";
import type { GroupRecord, Workspace } from "@/types/workspace";
import { AppHeader } from "./AppHeader";
import { CanvasSearch } from "./CanvasSearch";
import { TagSidebar } from "./TagSidebar";
import { useClipboardRecorder } from "@/components/groups/clipboard/useClipboardRecorder";

const SIDEBAR_KEY = "yuri2.tagSidebarOpen";

function loadSidebarOpen(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_KEY) !== "0";
  } catch {
    return true;
  }
}

function saveSidebarOpen(open: boolean) {
  try {
    localStorage.setItem(SIDEBAR_KEY, open ? "1" : "0");
  } catch {
    // stockage indisponible
  }
}

/** Application : espaces de travail en onglets, canevas de composants, fenêtres d'édition. */
export function AppShell() {
  const ws = useWorkspaces();
  const grp = useGroups();
  useClipboardRecorder(grp.groups, grp.updateState);

  const [workspaceDialog, setWorkspaceDialog] = useState<WorkspaceDialogTarget | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  // Incrémenté à chaque Ctrl+F : remonte la barre pour lui redonner le focus.
  const [searchFocus, setSearchFocus] = useState(0);
  const [query, setQuery] = useState("");
  // Filtre par tag (un seul à la fois), non mémorisé entre deux lancements.
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(loadSidebarOpen);
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((open) => {
      saveSidebarOpen(!open);
      return !open;
    });
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Remplace la recherche native de la WebView.
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setSearchOpen(true);
        setSearchFocus((n) => n + 1);
      } else if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      } else if ((e.ctrlKey || e.metaKey) && e.key === ",") {
        e.preventDefault();
        setSettingsOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleSidebar]);

  const activeWorkspace = ws.workspaces.find((w) => w.id === ws.activeId);
  const inWorkspace = useMemo(() => grp.groups.filter((g) => g.workspaceId === ws.activeId), [grp.groups, ws.activeId]);
  const workspaceTags = useMemo(() => tagCounts(inWorkspace), [inWorkspace]);
  const tagNames = useMemo(() => workspaceTags.map((t) => t.tag), [workspaceTags]);
  // Tag disparu (changement d'espace, dernier composant détagué) : le filtre tombe.
  const tag = activeTag && tagNames.includes(activeTag) ? activeTag : null;
  const unminimized = useMemo(() => inWorkspace.filter((g) => !g.minimized), [inWorkspace]);
  const visible = useMemo(
    () => (tag ? unminimized.filter((g) => g.tags.includes(tag)) : unminimized),
    [unminimized, tag],
  );
  const minimized = useMemo(() => inWorkspace.filter((g) => g.minimized), [inWorkspace]);
  const matchIds = useMemo(() => {
    if (!searchOpen || !query.trim()) return null;
    return new Set(inWorkspace.filter((g) => groupMatches(g, query)).map((g) => g.id));
  }, [searchOpen, query, inWorkspace]);
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const g of grp.groups) map[g.workspaceId] = (map[g.workspaceId] ?? 0) + 1;
    return map;
  }, [grp.groups]);

  const { update, remove } = grp;
  const handleStateChange = useCallback((id: string, state: unknown) => update(id, { state }), [update]);
  const handleTagClick = useCallback((t: string) => setActiveTag((cur) => (cur === t ? null : t)), []);
  const handleMinimize = useCallback((id: string) => update(id, { minimized: true }), [update]);
  const handleDelete = useCallback(
    async (group: GroupRecord) => {
      if (await confirmDelete(`Supprimer le composant « ${group.name} » et tout son contenu ?`)) remove(group.id);
    },
    [remove],
  );

  async function handleDeleteWorkspace(workspace: Workspace) {
    const n = counts[workspace.id] ?? 0;
    const message =
      n > 0
        ? `Supprimer l'espace « ${workspace.name} » et ses ${n} composant${n > 1 ? "s" : ""} ?`
        : `Supprimer l'espace « ${workspace.name} » ?`;
    if (!(await confirmDelete(message))) return;
    await ws.remove(workspace.id);
    grp.dropWorkspace(workspace.id);
  }

  function handleCreateGroup(kind: GroupKind, name: string, tags: string[]) {
    if (ws.activeId) grp.add({ kind, name, color: null, workspaceId: ws.activeId, tags });
  }

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
  }

  /** Entrée dans le filtre : amène le premier composant correspondant à l'écran. */
  function revealFirstMatch() {
    const first = visible.find((g) => matchIds?.has(g.id));
    document.querySelector(`[data-group-id="${first?.id}"]`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  /** Capture l'écran principal et la range dans un nouveau composant Image de l'espace actif. */
  async function handleQuickCapture() {
    const workspaceId = ws.activeId;
    if (!workspaceId || capturing) return;
    setCapturing(true);
    try {
      const image = await invoke<string>("capture_primary_screen");
      const name = `Capture ${new Date().toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}`;
      const id = grp.add({
        kind: "image",
        name,
        color: null,
        workspaceId,
        state: { image, markerState: null, rendered: null },
      });
      // Posé en bas du canevas : on retire un éventuel filtre de tag qui le masquerait, puis on y défile.
      setActiveTag(null);
      window.setTimeout(() => {
        document.querySelector(`[data-group-id="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
      notify({ title: "Capture ajoutée", body: `Composant « ${name} »`, kind: "success", durationMs: 4000 });
    } catch (err) {
      notify({ title: "Capture impossible", body: String(err), kind: "alarm", durationMs: 8000 });
    } finally {
      setCapturing(false);
    }
  }

  /** Aligne les composants non réduits de l'espace actif (filtre de tag ignoré), annulable. */
  function handleArrange() {
    const before = unminimized.map(({ id, x, y, w, h }) => ({ id, x, y, w, h }));
    grp.applyLayout(arrangeInRows(unminimized));
    notify({
      title: "Espace réorganisé",
      body: "Composants alignés en lignes.",
      kind: "success",
      durationMs: 8000,
      action: { label: "Annuler", onPress: () => grp.applyLayout(before) },
    });
  }

  function handleSaveSettings(id: string, settings: GroupSettings) {
    update(id, settings);
  }

  if (!ws.loaded || !grp.loaded) {
    return (
      <div className="grid h-screen place-items-center bg-background">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <AppHeader
        onAddGroup={() => setAddOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onArrange={handleArrange}
        onCapture={() => void handleQuickCapture()}
        capturing={capturing}
        canArrange={unminimized.length > 0}
        canAddGroup={!!activeWorkspace}
        search={
          searchOpen && (
            <CanvasSearch
              key={searchFocus}
              query={query}
              onQueryChange={setQuery}
              matchCount={matchIds?.size ?? inWorkspace.length}
              total={inWorkspace.length}
              onSubmit={revealFirstMatch}
              onClose={closeSearch}
            />
          )
        }
      >
        <WorkspaceTabs
          workspaces={ws.workspaces}
          activeId={ws.activeId}
          counts={counts}
          onSelect={ws.setActiveId}
          onCreate={() => setWorkspaceDialog({ mode: "create" })}
          onEdit={(workspace) => setWorkspaceDialog({ mode: "edit", workspace })}
          onMove={ws.move}
          onDelete={handleDeleteWorkspace}
        />
      </AppHeader>

      <div className="flex min-h-0 flex-1">
        <TagSidebar
          open={sidebarOpen}
          onToggle={toggleSidebar}
          tags={workspaceTags}
          total={inWorkspace.length}
          active={tag}
          onChange={setActiveTag}
        />

        <main
          className="canvas-bg min-h-0 flex-1 overflow-auto"
          style={
            {
              "--ws-tint": activeWorkspace?.color ?? "var(--accent)",
            } as CSSProperties
          }
        >
          {visible.length > 0 ? (
            <GroupCanvas
              groups={visible}
              onLayoutChange={grp.applyLayout}
              onStateChange={handleStateChange}
              onMinimize={handleMinimize}
              onEdit={setEditingGroupId}
              onDelete={handleDelete}
              onTagClick={handleTagClick}
              matchIds={matchIds}
            />
          ) : tag && unminimized.length > 0 ? (
            <p className="p-10 text-center text-[0.963rem] text-muted">Aucun composant affiché avec le tag #{tag}.</p>
          ) : (
            <EmptyWorkspace onAdd={() => setAddOpen(true)} />
          )}
        </main>
      </div>

      <MinimizedDock groups={minimized} onRestore={(id) => update(id, { minimized: false })} matchIds={matchIds} />

      <WorkspaceDialog
        target={workspaceDialog}
        onClose={() => setWorkspaceDialog(null)}
        onSubmit={(name, color) => {
          if (workspaceDialog?.mode === "edit") void ws.update(workspaceDialog.workspace.id, name, color);
          else void ws.create(name, color);
        }}
      />
      <AddGroupDialog
        isOpen={addOpen}
        workspaceName={activeWorkspace?.name}
        tagSuggestions={tagNames}
        onClose={() => setAddOpen(false)}
        onCreate={handleCreateGroup}
      />
      <SettingsDialog isOpen={settingsOpen} workspaces={ws.workspaces} onClose={() => setSettingsOpen(false)} />
      <GroupSettingsDialog
        group={grp.groups.find((g) => g.id === editingGroupId) ?? null}
        workspaces={ws.workspaces}
        tagSuggestions={tagNames}
        onClose={() => setEditingGroupId(null)}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
