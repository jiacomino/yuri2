import { useState } from "react";
import { Button, Description, Input, Label, TextField } from "@heroui/react";
import {
  loadGoogleClientId,
  loadGoogleClientSecret,
  saveGoogleClientId,
  saveGoogleClientSecret,
} from "@/lib/google";

type CredentialsFormProps = {
  onSaved: () => void;
  onCancel?: () => void;
};

/**
 * Saisie du Client ID et du Client Secret OAuth (client « Application de bureau »).
 * Stockés localement, partagés par tous les groupes Google Agenda.
 */
export function CredentialsForm({ onSaved, onCancel }: CredentialsFormProps) {
  const [clientId, setClientId] = useState(loadGoogleClientId);
  const [secret, setSecret] = useState(loadGoogleClientSecret);
  const idLooksWrong = clientId.trim() !== "" && !clientId.trim().endsWith(".apps.googleusercontent.com");

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        saveGoogleClientId(clientId);
        saveGoogleClientSecret(secret);
        onSaved();
      }}
    >
      <p className="text-[0.8889rem] leading-relaxed text-muted">
        Créez un client OAuth de type « Application de bureau » dans Google Cloud Console → API et services →
        Identifiants, avec l'API Google Calendar activée. Les deux champs sont requis : Google exige le secret même
        en flux PKCE natif.
      </p>
      <TextField value={clientId} onChange={setClientId} className="flex flex-col gap-1">
        <Label className="text-[0.8889rem] font-semibold">Client ID</Label>
        <Input placeholder="xxxxxxxxxx.apps.googleusercontent.com" spellCheck={false} autoComplete="off" className="font-mono text-xs" />
        {idLooksWrong && (
          <Description className="text-[0.8889rem] text-warning">
            Un Client ID se termine normalement par « .apps.googleusercontent.com ».
          </Description>
        )}
      </TextField>
      <TextField value={secret} onChange={setSecret} type="password" className="flex flex-col gap-1">
        <Label className="text-[0.8889rem] font-semibold">Client Secret</Label>
        <Input placeholder="GOCSPX-…" spellCheck={false} autoComplete="off" className="font-mono text-xs" />
      </TextField>
      <div className="flex justify-end gap-1.5">
        {onCancel && (
          <Button size="sm" variant="secondary" onPress={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" size="sm" variant="primary" isDisabled={!clientId.trim() || !secret.trim()}>
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
