import { useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";

/**
 * Point d'ancrage d'un menu contextuel : un repère invisible posé sous le curseur, rendu dans
 * `document.body`. Dans le canevas, les composants sont positionnés par `transform`, qui
 * fausserait un `position: fixed` rendu sur place.
 *
 * Usage : `onContextMenu={openAt}` sur l'élément, `{anchor}` dans le rendu, et
 * `triggerRef={point ? anchorRef : undefined}` sur le popover du menu. Sans point (menu ouvert
 * par son bouton), le popover garde son déclencheur habituel.
 */
export function useContextMenuAnchor(onOpen: () => void) {
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);

  function openAt(e: MouseEvent) {
    e.preventDefault();
    setPoint({ x: e.clientX, y: e.clientY });
    onOpen();
  }

  const anchor =
    point &&
    createPortal(
      <span
        ref={anchorRef}
        aria-hidden
        style={{ position: "fixed", left: point.x, top: point.y, width: 0, height: 0, pointerEvents: "none" }}
      />,
      document.body,
    );

  return { point, anchorRef, anchor, openAt, reset: () => setPoint(null) };
}
