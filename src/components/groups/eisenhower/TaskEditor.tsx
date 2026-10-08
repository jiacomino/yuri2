import { useState } from "react";
import { Input } from "@heroui/react";

type TaskEditorProps = {
  initial?: string;
  placeholder?: string;
  /** Appelé avec le texte saisi (Entrée ou perte de focus). */
  onCommit: (text: string) => void;
  onCancel: () => void;
};

/** Champ en ligne pour ajouter ou modifier une tâche. Échap annule. */
export function TaskEditor({ initial = "", placeholder, onCommit, onCancel }: TaskEditorProps) {
  const [text, setText] = useState(initial);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onCommit(text);
      }}
      className="shrink-0 rounded-[10px] bg-surface p-1 shadow-[0_1px_2px_rgba(16,24,40,.08)] ring-1 ring-accent/40"
    >
      <Input
        autoFocus
        value={text}
        placeholder={placeholder}
        aria-label={placeholder ?? "Texte de la tâche"}
        onChange={(e) => setText(e.currentTarget.value)}
        onBlur={() => onCommit(text)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
        }}
        className="h-7 w-full text-[0.963rem] shadow-none"
      />
    </form>
  );
}
