import { useState } from "react";
import { Button, Input } from "@heroui/react";
import { Plus } from "lucide-react";

type TodoAddFormProps = {
  onAdd: (text: string) => void;
};

/** Champ « Nouvelle tâche… » en haut de la liste. */
export function TodoAddForm({ onAdd }: TodoAddFormProps) {
  const [draft, setDraft] = useState("");

  function submit() {
    const clean = draft.trim();
    if (!clean) return;
    onAdd(clean);
    setDraft("");
  }

  return (
    <form
      className="flex items-center gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <Input
        aria-label="Nouvelle tâche"
        placeholder="Nouvelle tâche…"
        value={draft}
        onChange={(e) => setDraft(e.currentTarget.value)}
        variant="secondary"
        className="h-9 flex-1 rounded-[10px] px-3 py-0 text-[0.963rem]"
      />
      <Button
        type="submit"
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label="Ajouter la tâche"
        isDisabled={!draft.trim()}
        className="size-9 min-w-9"
      >
        <Plus className="size-4" />
      </Button>
    </form>
  );
}
