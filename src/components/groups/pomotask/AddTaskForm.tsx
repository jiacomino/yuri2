import { useState } from "react";
import { Button, Input } from "@heroui/react";
import { Plus } from "lucide-react";
import { EstimateMenu } from "./EstimateMenu";
import { DEFAULT_ESTIMATE } from "./state";

type AddTaskFormProps = {
  onAdd: (text: string, estimateMin: number) => void;
};

/** Champ « Nouvelle tâche… » + estimation + bouton d'ajout. */
export function AddTaskForm({ onAdd }: AddTaskFormProps) {
  const [text, setText] = useState("");
  const [estimate, setEstimate] = useState(DEFAULT_ESTIMATE);
  const clean = text.trim();

  function submit() {
    if (!clean) return;
    onAdd(clean, estimate);
    setText("");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex items-center gap-1.5"
    >
      <Input
        value={text}
        onChange={(e) => setText(e.currentTarget.value)}
        placeholder="Nouvelle tâche…"
        aria-label="Nouvelle tâche"
        className="min-w-0 flex-1"
      />
      <EstimateMenu value={estimate} onChange={setEstimate} />
      <Button type="submit" isIconOnly size="sm" variant="ghost" aria-label="Ajouter" isDisabled={!clean}>
        <Plus className="size-4" />
      </Button>
    </form>
  );
}
