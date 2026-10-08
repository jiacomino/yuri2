import { useRef, useState } from "react";
import { Input } from "@heroui/react";
import { cn } from "@/lib/utils";

type InlineInputProps = {
  initial?: string;
  placeholder?: string;
  ariaLabel: string;
  /** Appelé avec le texte saisi (Entrée ou perte de focus). */
  onCommit: (text: string) => void;
  /** Échap. */
  onCancel: () => void;
  /** Si vrai, une perte de focus avec un champ vide annule au lieu de valider. */
  cancelOnBlur?: boolean;
  className?: string;
};

/** Champ texte d'édition en ligne : Entrée / blur valide, Échap annule. */
export function InlineInput({
  initial = "",
  placeholder,
  ariaLabel,
  onCommit,
  onCancel,
  cancelOnBlur = false,
  className,
}: InlineInputProps) {
  const [draft, setDraft] = useState(initial);
  // Évite une double validation (Entrée puis blur au démontage).
  const settled = useRef(false);

  function commit() {
    if (settled.current) return;
    settled.current = true;
    onCommit(draft);
  }

  function cancel() {
    if (settled.current) return;
    settled.current = true;
    onCancel();
  }

  return (
    <Input
      autoFocus
      aria-label={ariaLabel}
      placeholder={placeholder}
      value={draft}
      onChange={(e) => setDraft(e.currentTarget.value)}
      onBlur={() => (cancelOnBlur && !draft.trim() ? cancel() : commit())}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        } else if (e.key === "Escape") {
          e.preventDefault();
          cancel();
        }
      }}
      className={cn("h-7 w-full rounded-lg px-2 py-0 text-[0.9259rem]", className)}
    />
  );
}
