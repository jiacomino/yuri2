import { useState } from "react";
import { Button, Input } from "@heroui/react";
import { AppPicker } from "./AppPicker";
import type { AppTag } from "./state";

type AddCardFormProps = {
  apps: AppTag[];
  onCreateApp: (name: string, color: string) => string | undefined;
  onSubmit: (title: string, appId?: string) => void;
  onCancel: () => void;
};

/** Formulaire en bas de colonne : titre + application. Reste ouvert pour enchaîner les ajouts. */
export function AddCardForm({ apps, onCreateApp, onSubmit, onCancel }: AddCardFormProps) {
  const [title, setTitle] = useState("");
  const [appId, setAppId] = useState<string | undefined>(undefined);

  return (
    <form
      className="flex flex-col gap-2 rounded-[10px] bg-surface p-2.5 shadow-[0_1px_2px_rgba(16,24,40,.08)]"
      onSubmit={(e) => {
        e.preventDefault();
        const clean = title.trim();
        if (!clean) {
          onCancel();
          return;
        }
        onSubmit(clean, appId);
        setTitle("");
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
      }}
    >
      <Input
        autoFocus
        aria-label="Titre de la carte"
        placeholder="Titre de la carte"
        value={title}
        onChange={(e) => setTitle(e.currentTarget.value)}
        onBlur={(e) => {
          // Reste ouvert tant que le focus reste dans le formulaire (pastilles, boutons).
          const form = e.currentTarget.form;
          const next = e.relatedTarget as Node | null;
          if (!title.trim() && !(next && form?.contains(next))) onCancel();
        }}
        className="h-7 rounded-lg px-2 py-0 text-[0.9259rem]"
      />
      <AppPicker apps={apps} value={appId} onChange={setAppId} onCreateApp={onCreateApp} />
      <div className="flex items-center justify-end gap-1">
        <Button size="sm" variant="ghost" onPress={onCancel} className="h-7 px-2.5 text-xs">
          Annuler
        </Button>
        <Button type="submit" size="sm" variant="primary" className="h-7 px-2.5 text-xs">
          Ajouter
        </Button>
      </div>
    </form>
  );
}
