import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button, SearchField } from "@heroui/react";
import { Copy, Pause, Pin, PinOff, Play, Trash2 } from "lucide-react";
import { formatRelative } from "@/lib/alarm";
import { confirmDelete } from "@/lib/confirm";
import { normalizeSearch } from "@/lib/search";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";
import type { BodyProps } from "../types";
import { clipLabel, type ClipboardState, type ClipItem } from "./state";

/**
 * Corps du groupe « Presse-papiers » : historique des copies (texte et images), alimenté par
 * `useClipboardRecorder`. Clic sur un élément = le recopier.
 */
export function ClipboardBody({ value, onChange }: BodyProps<ClipboardState>) {
  const [query, setQuery] = useState("");
  const needle = normalizeSearch(query.trim());
  const items = needle ? value.items.filter((i) => normalizeSearch(clipLabel(i)).includes(needle)) : value.items;
  const unpinned = value.items.filter((i) => !i.pinned).length;

  async function copy(item: ClipItem) {
    try {
      if (item.kind === "text") await invoke("clipboard_write_text", { text: item.text, sensitive: false });
      else await invoke("clipboard_write_image", { dataUrl: item.dataUrl });
      notify({ title: "Copié dans le presse-papiers", kind: "success", durationMs: 2000 });
    } catch (err) {
      notify({ title: "Copie impossible", body: String(err), kind: "alarm", durationMs: 6000 });
    }
  }

  function togglePin(id: string) {
    onChange({ ...value, items: value.items.map((i) => (i.id === id ? { ...i, pinned: !i.pinned } : i)) });
  }

  function remove(id: string) {
    onChange({ ...value, items: value.items.filter((i) => i.id !== id) });
  }

  async function clear() {
    if (await confirmDelete(`Effacer les ${unpinned} élément(s) non épinglé(s) de l'historique ?`)) {
      onChange({ ...value, items: value.items.filter((i) => i.pinned) });
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex shrink-0 items-center gap-1">
        <SearchField
          aria-label="Rechercher dans l'historique"
          value={query}
          onChange={setQuery}
          className="min-w-0 flex-1"
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Rechercher…" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
        <Button
          isIconOnly
          size="sm"
          variant={value.paused ? "secondary" : "ghost"}
          aria-label={value.paused ? "Reprendre l'enregistrement" : "Mettre l'enregistrement en pause"}
          aria-pressed={value.paused}
          onPress={() => onChange({ ...value, paused: !value.paused })}
        >
          {value.paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          aria-label="Vider l'historique (sauf épinglés)"
          isDisabled={unpinned === 0}
          onPress={() => void clear()}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      {value.paused && (
        <p className="shrink-0 rounded-lg bg-warning/10 px-2.5 py-1.5 text-[0.8889rem] text-warning">
          En pause : les nouvelles copies ne sont pas enregistrées.
        </p>
      )}

      <ul className="m-0 flex min-h-0 flex-1 list-none flex-col gap-0.5 overflow-y-auto p-0">
        {items.length === 0 ? (
          <li className="py-6 text-center text-[0.8889rem] text-muted">
            {needle ? "Aucun élément ne correspond." : "Copiez du texte ou une image : l'historique s'affiche ici."}
          </li>
        ) : (
          items.map((item) => (
            <ClipRow
              key={item.id}
              item={item}
              onCopy={() => void copy(item)}
              onTogglePin={() => togglePin(item.id)}
              onRemove={() => remove(item.id)}
            />
          ))
        )}
      </ul>
    </div>
  );
}

type ClipRowProps = { item: ClipItem; onCopy: () => void; onTogglePin: () => void; onRemove: () => void };

function ClipRow({ item, onCopy, onTogglePin, onRemove }: ClipRowProps) {
  return (
    <li
      className="list-row group/clip flex cursor-pointer items-start gap-2 rounded-[10px] px-2.5 py-2"
      onClick={onCopy}
      title="Cliquer pour recopier"
    >
      <div className="min-w-0 flex-1">
        {item.kind === "text" ? (
          <p className="line-clamp-3 text-[0.963rem] break-words whitespace-pre-wrap">{item.text}</p>
        ) : (
          <img
            src={item.dataUrl}
            alt={clipLabel(item)}
            draggable={false}
            className="max-h-28 max-w-full rounded-md object-contain shadow-[0_1px_2px_rgba(16,24,40,.08)]"
          />
        )}
        <span className="mt-0.5 flex items-center gap-1 text-[0.8148rem] text-muted">
          {item.pinned && <Pin className="size-3 fill-current" aria-label="Épinglé" />}
          {item.kind === "image" && `${item.width} × ${item.height} · `}
          {formatRelative(item.at)}
        </span>
      </div>
      {/* Les actions ne doivent pas déclencher la copie de la ligne. */}
      <div
        className="-my-1 flex shrink-0 items-center opacity-0 transition-opacity group-hover/clip:opacity-100 focus-within:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <Button isIconOnly size="sm" variant="ghost" aria-label="Copier" onPress={onCopy}>
          <Copy className="size-3.5" />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          aria-label={item.pinned ? "Désépingler" : "Épingler"}
          onPress={onTogglePin}
          className={cn(item.pinned && "text-accent")}
        >
          {item.pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          aria-label="Supprimer"
          className="hover:text-danger"
          onPress={onRemove}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </li>
  );
}
