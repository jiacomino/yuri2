import { SearchField } from "@heroui/react";

type CanvasSearchProps = {
  query: string;
  onQueryChange: (query: string) => void;
  /** Nombre de composants correspondants (visibles et réduits). */
  matchCount: number;
  total: number;
  /** Entrée : amène le premier résultat à l'écran. */
  onSubmit: () => void;
  onClose: () => void;
};

/**
 * Barre de filtre des composants de l'espace (Ctrl+F). Échap vide le champ, puis le ferme
 * s'il est déjà vide.
 */
export function CanvasSearch({ query, onQueryChange, matchCount, total, onSubmit, onClose }: CanvasSearchProps) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <SearchField
        aria-label="Filtrer les composants"
        autoFocus
        value={query}
        onChange={onQueryChange}
        onSubmit={onSubmit}
        onKeyDown={(e) => {
          if (e.key === "Escape" && !query) onClose();
        }}
        onBlur={() => {
          if (!query) onClose();
        }}
        className="w-60"
      >
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder="Filtrer les composants…" />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>
      {query.trim() && (
        <span className="text-xs tabular-nums text-muted">
          {matchCount} / {total}
        </span>
      )}
    </div>
  );
}
