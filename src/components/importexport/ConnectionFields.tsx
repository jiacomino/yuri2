import { useState } from "react";
import { Button } from "@heroui/react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { SSL_MODES, type SslMode } from "@/lib/importExport";
import { SelectBox, TextInput } from "./ui";

export type ConnectionValue = { host: string; port: number; user: string; password: string; sslMode: SslMode };

/** Hôte, port, utilisateur, mot de passe et SSL (serveurs et connecteurs). */
export function ConnectionFields({ value, onChange }: { value: ConnectionValue; onChange: (patch: Partial<ConnectionValue>) => void }) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[1fr_7rem] gap-4">
        <TextInput label="Hôte" value={value.host} onChange={(host) => onChange({ host })} placeholder="localhost" />
        <TextInput
          label="Port"
          type="number"
          value={String(value.port)}
          onChange={(v) => onChange({ port: Math.max(1, Math.min(65535, Number(v) || 3306)) })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <TextInput label="Utilisateur" value={value.user} onChange={(user) => onChange({ user })} placeholder="root" />
        <div className="flex items-end gap-1">
          <TextInput
            label="Mot de passe"
            type={showPassword ? "text" : "password"}
            value={value.password}
            onChange={(password) => onChange({ password })}
            placeholder="Aucun"
            className="min-w-0 flex-1"
          />
          <Button
            isIconOnly
            variant="ghost"
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            onPress={() => setShowPassword((s) => !s)}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        </div>
      </div>
      <SelectBox
        label="SSL"
        value={value.sslMode}
        onChange={(v) => onChange({ sslMode: v as SslMode })}
        items={SSL_MODES.map((m) => ({ id: m.id, label: m.label }))}
      />
      <p className="-mt-2 text-[0.8148rem] text-muted">
        {SSL_MODES.find((m) => m.id === value.sslMode)?.hint}. Erreur « SSL is required, but the server does not support it » → choisissez « Désactivé ».
      </p>
      <p className="-mt-2 flex items-center gap-1.5 text-[0.8148rem] text-muted">
        <KeyRound className="size-3.5 shrink-0" />
        Mot de passe chiffré en base (AES-256) ; transmis à MariaDB par un fichier d'options temporaire, jamais sur la ligne de commande.
      </p>
    </div>
  );
}
