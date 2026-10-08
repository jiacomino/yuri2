import { useEffect, useRef, useState, type RefObject } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";

/**
 * Dépôt de fichiers depuis l'Explorateur sur un élément. Le glisser-déposer natif de Tauri
 * (seul à fournir les chemins) est global à la fenêtre : l'élément visé est retrouvé par
 * `elementFromPoint`, ce qui départage aussi deux composants superposés sur le canevas.
 *
 * Renvoie vrai tant que des fichiers survolent l'élément (pour l'afficher en surbrillance).
 */
export function useFileDrop(ref: RefObject<HTMLElement | null>, onDrop: (paths: string[]) => void): boolean {
  const [over, setOver] = useState(false);
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;

  useEffect(() => {
    // Position physique (pixels de l'écran) → pixels CSS de la page.
    function isInside(position: { x: number; y: number }): boolean {
      const el = ref.current;
      if (!el) return false;
      const ratio = window.devicePixelRatio || 1;
      const hit = document.elementFromPoint(position.x / ratio, position.y / ratio);
      return !!hit && el.contains(hit);
    }

    let unlisten: (() => void) | undefined;
    let disposed = false;
    getCurrentWebview()
      .onDragDropEvent(({ payload }) => {
        if (payload.type === "enter" || payload.type === "over") {
          setOver(isInside(payload.position));
        } else if (payload.type === "drop") {
          setOver(false);
          if (payload.paths.length > 0 && isInside(payload.position)) onDropRef.current(payload.paths);
        } else {
          setOver(false);
        }
      })
      .then(
        (fn) => (disposed ? fn() : (unlisten = fn)),
        () => {}, // Hors Tauri (aperçu navigateur) : pas de dépôt de fichiers.
      );
    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [ref]);

  return over;
}
