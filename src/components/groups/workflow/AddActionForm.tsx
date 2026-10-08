import { useEffect, useRef, useState } from "react";
import { Button, Input } from "@heroui/react";
import { X } from "lucide-react";
import { compactInputClass } from "./ui";

type AddActionFormProps = {
  stepName: string;
  onSubmit: (title: string) => void;
  onCancel: () => void;
};

/** Saisie rapide d'actions dans une étape ; reste ouverte (on ajoute souvent en rafale). */
export function AddActionForm({ stepName, onSubmit, onCancel }: AddActionFormProps) {
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <form
      className="mt-1.5 flex items-center gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        const clean = title.trim();
        if (!clean) return;
        onSubmit(clean);
        setTitle("");
        inputRef.current?.focus();
      }}
    >
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
        }}
        placeholder={`Action dans « ${stepName} »…`}
        aria-label="Nouvelle action"
        className={`${compactInputClass} min-w-0 flex-1`}
      />
      <Button type="submit" size="sm" variant="primary" isDisabled={!title.trim()}>
        Ajouter
      </Button>
      <Button isIconOnly size="sm" variant="ghost" aria-label="Fermer" onPress={onCancel}>
        <X className="size-4" />
      </Button>
    </form>
  );
}
