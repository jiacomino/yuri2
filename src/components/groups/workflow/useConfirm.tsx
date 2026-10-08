import { useCallback, useRef, useState } from "react";
import { ConfirmModal, type ConfirmRequest } from "./ConfirmModal";

/**
 * Confirmation asynchrone basée sur une modale HeroUI :
 * `if (await confirm({...})) …`. Rendre `dialog` une fois dans l'arbre.
 */
export function useConfirm() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const confirm = useCallback((req: ConfirmRequest) => {
    // Une demande encore ouverte est considérée comme refusée.
    resolver.current?.(false);
    setRequest(req);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const handleResolve = useCallback((ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setRequest(null);
  }, []);

  const dialog = <ConfirmModal request={request} onResolve={handleResolve} />;
  return { confirm, dialog };
}
