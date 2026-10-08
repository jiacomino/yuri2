import { useState } from "react";
import { confirm } from "@tauri-apps/plugin-dialog";
import { KeyRound, Plus } from "lucide-react";
import { openWithPref } from "@/lib/browserPref";
import { notify } from "@/lib/notify";
import { normalizeUrl } from "@/lib/url";
import type { BodyProps } from "../types";
import { copyWithNotice } from "./clipboard";
import type { EntryAction } from "./EntryMenu";
import { EntryFormModal } from "./EntryFormModal";
import { EntryRow } from "./EntryRow";
import { PasswordTabsBar } from "./PasswordTabsBar";
import { SecurityNotice } from "./SecurityNotice";
import { newId, type EntryDraft, type PasswordEntry, type PasswordState } from "./state";

type FormState = { mode: "add" } | { mode: "edit"; entry: PasswordEntry } | null;

/** Corps du groupe « Mots de passe » : identifiants classés par onglets. */
export function PasswordBody({ value, onChange }: BodyProps<PasswordState>) {
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(null);

  const activeTab = value.tabs.find((t) => t.id === value.activeTabId) ?? value.tabs[0];
  const entries = activeTab?.entries ?? [];

  function patchActiveEntries(patch: (entries: PasswordEntry[]) => PasswordEntry[]) {
    if (!activeTab) return;
    onChange({
      ...value,
      tabs: value.tabs.map((t) => (t.id === activeTab.id ? { ...t, entries: patch(t.entries) } : t)),
    });
  }

  // ─── Onglets ──────────────────────────────────────────────────────────────
  function selectTab(id: string) {
    if (id === value.activeTabId) return;
    onChange({ ...value, activeTabId: id });
    setRevealedId(null);
  }

  function addTab(name: string) {
    const id = newId();
    onChange({ tabs: [...value.tabs, { id, name, entries: [] }], activeTabId: id });
    setRevealedId(null);
  }

  function renameTab(id: string, name: string) {
    onChange({ ...value, tabs: value.tabs.map((t) => (t.id === id ? { ...t, name } : t)) });
  }

  async function removeTab(id: string) {
    const tab = value.tabs.find((t) => t.id === id);
    if (!tab || value.tabs.length <= 1) return;
    const n = tab.entries.length;
    const message =
      n > 0
        ? `Supprimer l'onglet « ${tab.name} » et ses ${n} identifiant${n > 1 ? "s" : ""} ?`
        : `Supprimer l'onglet « ${tab.name} » ?`;
    if (!(await confirm(message, { title: "Confirmer la suppression", kind: "warning" }))) return;
    const remaining = value.tabs.filter((t) => t.id !== id);
    onChange({ tabs: remaining, activeTabId: value.activeTabId === id ? remaining[0].id : value.activeTabId });
  }

  // ─── Identifiants ─────────────────────────────────────────────────────────
  function submitEntry(draft: EntryDraft) {
    if (form?.mode === "edit") {
      const id = form.entry.id;
      patchActiveEntries((list) => list.map((e) => (e.id === id ? { ...draft, id } : e)));
    } else {
      patchActiveEntries((list) => [...list, { ...draft, id: newId() }]);
    }
  }

  async function removeEntry(entry: PasswordEntry) {
    const ok = await confirm(`Supprimer l'identifiant « ${entry.name} » ? Cette action est irréversible.`, {
      title: "Confirmer la suppression",
      kind: "warning",
    });
    if (!ok) return;
    patchActiveEntries((list) => list.filter((e) => e.id !== entry.id));
    if (revealedId === entry.id) setRevealedId(null);
  }

  function handleAction(entry: PasswordEntry, action: EntryAction) {
    switch (action) {
      case "copy-password":
        return void copyWithNotice("Mot de passe", entry.password);
      case "copy-username":
        return void copyWithNotice("Nom d'utilisateur", entry.username);
      case "copy-url":
        return void copyWithNotice("Adresse", entry.url ?? "");
      case "open-url":
        if (entry.url) {
          openWithPref(normalizeUrl(entry.url)).catch((err) =>
            notify({ title: "Impossible d'ouvrir l'adresse", body: String(err) }),
          );
        }
        return;
      case "toggle-reveal":
        return setRevealedId((id) => (id === entry.id ? null : entry.id));
      case "edit":
        return setForm({ mode: "edit", entry });
      case "delete":
        return void removeEntry(entry);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <SecurityNotice />

      <PasswordTabsBar
        tabs={value.tabs}
        activeTabId={activeTab?.id ?? ""}
        onSelect={selectTab}
        onAdd={addTab}
        onRename={renameTab}
        onRemove={(id) => void removeTab(id)}
      />

      <ul className="m-0 flex min-h-0 flex-1 list-none flex-col gap-0.5 overflow-y-auto p-0">
        {entries.length === 0 ? (
          <li className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center text-[0.8889rem] text-muted">
            <span className="grid size-10 place-items-center rounded-xl bg-accent/10 text-accent">
              <KeyRound className="size-5" />
            </span>
            Aucun identifiant dans cet onglet.
          </li>
        ) : (
          entries.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              revealed={revealedId === entry.id}
              onAction={(action) => handleAction(entry, action)}
            />
          ))
        )}
      </ul>

      <button
        type="button"
        onClick={() => setForm({ mode: "add" })}
        className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-border bg-transparent font-semibold text-muted transition-colors hover:border-accent/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
      >
        <Plus className="size-3.5" />
        Ajouter
      </button>

      <EntryFormModal
        isOpen={form !== null}
        initial={form?.mode === "edit" ? form.entry : null}
        onSubmit={submitEntry}
        onClose={() => setForm(null)}
      />
    </div>
  );
}
