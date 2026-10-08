import { useId, useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { normalizeTag } from "@/lib/tags";
import { cn } from "@/lib/utils";

const MAX_SUGGESTIONS = 8;

type TagInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  /** Tags existants proposés à la saisie. */
  suggestions?: string[];
  placeholder?: string;
  autoFocus?: boolean;
};

/**
 * Saisie de tags en pastilles. Entrée, virgule ou espace valide le tag ; Retour arrière sur
 * un champ vide retire le dernier ; ↑/↓ parcourent les suggestions, Échap les ferme.
 */
export function TagInput({ value, onChange, suggestions = [], placeholder = "Ajouter un tag…", autoFocus }: TagInputProps) {
  const listId = useId();
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  const query = normalizeTag(draft);
  const matches = suggestions
    .filter((s) => !value.includes(s) && s.includes(query))
    .slice(0, MAX_SUGGESTIONS);
  const showList = open && matches.length > 0;

  function add(raw: string) {
    const tag = normalizeTag(raw);
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setDraft("");
    setHighlight(-1);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "," || (e.key === " " && draft.trim())) {
      if (e.key === "Enter" && !draft.trim() && highlight < 0) return; // laisse le formulaire se valider
      e.preventDefault();
      add(showList && highlight >= 0 ? matches[highlight] : draft);
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    } else if (e.key === "ArrowDown" && matches.length > 0) {
      e.preventDefault();
      setOpen(true);
      setHighlight((i) => (i + 1) % matches.length);
    } else if (e.key === "ArrowUp" && matches.length > 0) {
      e.preventDefault();
      setOpen(true);
      setHighlight((i) => (i <= 0 ? matches.length - 1 : i - 1));
    } else if (e.key === "Escape" && showList) {
      // Ferme les suggestions sans fermer la fenêtre parente.
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      setHighlight(-1);
    }
  }

  return (
    <div className="relative">
      <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-[10px] bg-field px-2 py-1.5 ring-1 ring-field-border focus-within:ring-2 focus-within:ring-focus">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-0.5 rounded-full bg-accent/12 py-0.5 pr-1 pl-2 text-[0.8889rem] font-semibold text-accent"
          >
            #{tag}
            <button
              type="button"
              aria-label={`Retirer #${tag}`}
              onClick={() => onChange(value.filter((t) => t !== tag))}
              className="grid size-4 cursor-pointer place-items-center rounded-full hover:bg-accent/20"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          autoFocus={autoFocus}
          onChange={(e) => {
            setDraft(e.target.value);
            setOpen(true);
            setHighlight(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            if (draft.trim()) add(draft);
            setOpen(false);
          }}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : undefined}
          role="combobox"
          aria-label="Tags"
          aria-expanded={showList}
          aria-controls={listId}
          className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-field-placeholder"
        />
      </div>
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-50 mt-1 max-h-56 overflow-auto rounded-[10px] bg-overlay p-1 shadow-lg ring-1 ring-border"
        >
          {matches.map((s, i) => (
            <li
              key={s}
              role="option"
              aria-selected={i === highlight}
              // mousedown : passe avant le blur du champ, qui fermerait la liste.
              onMouseDown={(e) => {
                e.preventDefault();
                add(s);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={cn(
                "cursor-pointer rounded-md px-2 py-1 text-sm",
                i === highlight ? "bg-default text-foreground" : "text-muted",
              )}
            >
              #{s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
