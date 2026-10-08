import { useRef, useState } from "react";
import { Input } from "@heroui/react";
import { cn } from "@/lib/utils";

type InlineInputProps = {
  initialValue?: string;
  placeholder?: string;
  ariaLabel: string;
  /** Appelé avec la valeur nettoyée (non vide) sur Entrée ou perte du focus. */
  onCommit: (value: string) => void;
  /** Appelé sur Échap, ou si la valeur est vide à la validation. */
  onCancel: () => void;
  className?: string;
};

/** Champ texte éphémère : Entrée / perte de focus valide, Échap annule. */
export function InlineInput({ initialValue = "", placeholder, ariaLabel, onCommit, onCancel, className }: InlineInputProps) {
  const [value, setValue] = useState(initialValue);
  // Empêche une double validation (Entrée puis blur au démontage).
  const doneRef = useRef(false);

  function finish(commit: boolean) {
    if (doneRef.current) return;
    doneRef.current = true;
    const clean = value.trim();
    if (commit && clean) onCommit(clean);
    else onCancel();
  }

  return (
    <Input
      autoFocus
      aria-label={ariaLabel}
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.currentTarget.value)}
      onBlur={() => finish(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          finish(true);
        } else if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          finish(false);
        }
      }}
      className={cn("h-8 rounded-xl px-3 text-[0.9259rem]", className)}
    />
  );
}
