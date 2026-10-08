import { useState } from "react";
import { Button } from "@heroui/react";
import { ExternalLink, Eye, EyeOff, KeyRound, User } from "lucide-react";
import { hostnameOf } from "@/lib/url";
import { useContextMenuAnchor } from "@/components/shared/useContextMenuAnchor";
import { cn } from "@/lib/utils";
import { EntryMenu, type EntryAction } from "./EntryMenu";
import type { PasswordEntry } from "./state";

type EntryRowProps = {
  entry: PasswordEntry;
  revealed: boolean;
  onAction: (action: EntryAction) => void;
};

/** Ligne d'identifiant : clic sur l'utilisateur ou le mot de passe pour copier. */
export function EntryRow({ entry, revealed, onAction }: EntryRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnchor = useContextMenuAnchor(() => setMenuOpen(true));

  return (
    <li
      onContextMenu={menuAnchor.openAt}
      data-active={menuOpen}
      className="list-row group/entry flex flex-col gap-0.5 rounded-[10px] px-2.5 py-2"
    >
      <div className="flex min-h-7 items-center gap-3">
        <span className="grid size-[26px] shrink-0 place-items-center rounded-[7px] bg-teal-500/12 text-teal-600 dark:bg-teal-400/15 dark:text-teal-300">
          <KeyRound className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1 truncate font-semibold">{entry.name}</span>
        {entry.url && (
          <span className="max-w-[40%] shrink-0 truncate text-[0.8889rem] text-muted">
            {hostnameOf(entry.url)}
          </span>
        )}
        <div
          className="-my-1 flex items-center opacity-0 transition-opacity group-hover/entry:opacity-100 focus-within:opacity-100 data-[open=true]:opacity-100"
          data-open={menuOpen}
        >
          {entry.url && (
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label="Ouvrir l'adresse"
              onPress={() => onAction("open-url")}
              className="size-7 min-w-7 rounded-lg text-muted hover:text-foreground"
            >
              <ExternalLink className="size-3.5" />
            </Button>
          )}
          <EntryMenu
            isOpen={menuOpen}
            onOpenChange={(open) => {
              setMenuOpen(open);
              if (!open) menuAnchor.reset();
            }}
            anchorRef={menuAnchor.point ? menuAnchor.anchorRef : undefined}
            hasUrl={!!entry.url}
            revealed={revealed}
            onAction={onAction}
          />
          {menuAnchor.anchor}
        </div>
      </div>

      <div className="flex items-center gap-2 pl-8 text-[0.8889rem]">
        <button
          type="button"
          onClick={() => onAction("copy-username")}
          title="Copier le nom d'utilisateur"
          className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left text-muted transition-colors hover:bg-default hover:text-foreground"
        >
          <User className="size-3 shrink-0" />
          <span className="truncate">{entry.username || "(vide)"}</span>
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-0.5">
          <button
            type="button"
            onClick={() => onAction("copy-password")}
            title={entry.password ? "Copier le mot de passe" : "Aucun mot de passe"}
            className={cn(
              "flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left font-mono tracking-[.06em] tabular-nums transition-colors hover:bg-default hover:text-foreground",
              revealed ? "text-foreground" : "text-muted",
            )}
          >
            <KeyRound className="size-3 shrink-0" />
            <span className="truncate">
              {entry.password ? (revealed ? entry.password : "•".repeat(Math.min(entry.password.length, 10))) : "(vide)"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onAction("toggle-reveal")}
            aria-label={revealed ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            title={revealed ? "Masquer" : "Afficher"}
            className="grid size-6 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-default hover:text-accent"
          >
            {revealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
        </div>
      </div>
    </li>
  );
}
