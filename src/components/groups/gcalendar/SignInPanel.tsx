import { Button, Spinner } from "@heroui/react";
import { CalendarClock, KeyRound } from "lucide-react";

type SignInPanelProps = {
  loading: boolean;
  error: string | null;
  onSignIn: () => void;
  onEditCredentials: () => void;
};

/** Écran de connexion : ouvre le navigateur pour l'autorisation Google. */
export function SignInPanel({ loading, error, onSignIn, onEditCredentials }: SignInPanelProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
      <span className="grid size-10 place-items-center rounded-xl bg-accent/12 text-accent">
        <CalendarClock className="size-5" />
      </span>
      <div className="flex flex-col gap-0.5">
        <p className="text-[1.037rem] font-bold tracking-[-0.01em]">Connectez votre agenda</p>
        <p className="text-[0.8889rem] text-muted">Vos prochains événements Google, en lecture seule.</p>
      </div>
      <Button size="sm" variant="primary" className="h-9 rounded-[10px] px-4 font-semibold" onPress={onSignIn} isDisabled={loading}>
        {loading && <Spinner size="sm" color="current" />}
        {loading ? "Connexion… (voir le navigateur)" : "Se connecter avec Google"}
      </Button>
      {error && (
        <p className="max-w-xs rounded-[10px] bg-danger/10 px-2.5 py-2 text-[0.8889rem] font-medium break-words text-danger">
          {error}
        </p>
      )}
      <Button size="sm" variant="ghost" onPress={onEditCredentials} className="text-[0.8889rem] font-semibold text-muted">
        <KeyRound className="size-3.5" />
        Identifiants OAuth
      </Button>
    </div>
  );
}
