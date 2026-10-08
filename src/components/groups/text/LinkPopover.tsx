import { useState, type FormEvent } from "react";
import type { Editor } from "@tiptap/react";
import { Button, FieldError, Input, Popover, TextField } from "@heroui/react";
import { Link2 } from "lucide-react";
import { validateUrl } from "@/lib/url";
import { cn } from "@/lib/utils";

type LinkPopoverProps = {
  editor: Editor;
  isActive: boolean;
};

/** Ajout / modification / retrait d'un lien sur la sélection. */
export function LinkPopover({ editor, isActive }: LinkPopoverProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    if (next) {
      setUrl((editor.getAttributes("link").href as string | undefined) ?? "");
      setError(null);
    }
    setOpen(next);
  }

  function apply(e: FormEvent) {
    e.preventDefault();
    const result = validateUrl(url);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const href = result.url;
    const chain = editor.chain().focus();
    if (editor.state.selection.empty && !editor.isActive("link")) {
      // Pas de sélection : on insère l'URL elle-même comme texte du lien.
      chain.insertContent({ type: "text", text: href, marks: [{ type: "link", attrs: { href } }] }).run();
    } else {
      chain.extendMarkRange("link").setLink({ href }).run();
    }
    setOpen(false);
  }

  function remove() {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setOpen(false);
  }

  return (
    <Popover isOpen={open} onOpenChange={handleOpenChange}>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label="Lien"
        aria-pressed={isActive}
        className={cn(
          "size-7 min-w-7 rounded-lg text-muted hover:bg-surface hover:text-foreground",
          isActive && "bg-surface text-accent shadow-[0_1px_2px_rgba(16,24,40,.08)] hover:text-accent",
        )}
      >
        <span title="Lien (Ctrl+clic pour l'ouvrir)">
          <Link2 className="size-3.5" />
        </span>
      </Button>
      <Popover.Content placement="bottom start">
        <Popover.Dialog aria-label="Lien" className="w-72 p-3">
          <form onSubmit={apply} className="flex flex-col gap-2">
            <TextField
              aria-label="Adresse du lien"
              value={url}
              onChange={(v) => {
                setUrl(v);
                if (error) setError(null);
              }}
              isInvalid={!!error}
              autoFocus
            >
              <Input placeholder="https://exemple.com" className="text-xs" />
              <FieldError>{error}</FieldError>
            </TextField>
            <p className="text-[0.8889rem] text-muted">Ctrl+clic sur un lien du texte pour l'ouvrir.</p>
            <div className="flex items-center gap-1.5">
              {isActive && (
                <Button size="sm" variant="ghost" onPress={remove} className="text-danger">
                  Retirer le lien
                </Button>
              )}
              <span className="flex-1" />
              <Button size="sm" type="submit">
                Valider
              </Button>
            </div>
          </form>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
