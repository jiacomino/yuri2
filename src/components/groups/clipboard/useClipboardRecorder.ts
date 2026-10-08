import { useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import type { GroupRecord } from "@/types/workspace";
import { defaultState, recordClip, type Clip, type ClipboardState } from "./state";

/**
 * Écoute les copies remontées par Rust et les ajoute à TOUS les composants « Presse-papiers »,
 * affichés ou non (réduits, autre espace) : monté une seule fois, au niveau de l'application.
 */
export function useClipboardRecorder(
  groups: GroupRecord[],
  updateState: (id: string, fn: (state: unknown) => unknown) => void,
) {
  const idsRef = useRef<string[]>([]);
  idsRef.current = groups.filter((g) => g.kind === "clipboard").map((g) => g.id);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let cancelled = false;
    listen<Clip>("clipboard-changed", ({ payload }) => {
      for (const id of idsRef.current) {
        updateState(id, (state) => recordClip((state as ClipboardState | null) ?? defaultState(), payload));
      }
    })
      .then((fn) => {
        if (cancelled) fn();
        else unlisten = fn;
      })
      .catch((err) => console.warn("[clipboard] écoute impossible", err));
    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [updateState]);
}
