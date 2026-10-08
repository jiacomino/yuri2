import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { MarkerArea, type AnnotationState } from "@markerjs/markerjs3";
import { applyMarkerStyle, DEFAULT_MARKER_STYLE, type MarkerStyle } from "./markerTools";

/**
 * Monte un éditeur marker.js 3 (`MarkerArea`, web component « headless ») dans `hostRef`
 * et expose de quoi piloter la barre d'outils React.
 */
export function useMarkerArea(hostRef: RefObject<HTMLDivElement | null>, image: string, initial: AnnotationState | null) {
  const areaRef = useRef<MarkerArea | null>(null);
  const styleRef = useRef<MarkerStyle>(DEFAULT_MARKER_STYLE);
  const [style, setStyleState] = useState<MarkerStyle>(DEFAULT_MARKER_STYLE);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const [history, setHistory] = useState({ canUndo: false, canRedo: false });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const target = document.createElement("img");
    target.src = image;

    const area = new MarkerArea();
    area.autoZoomIn = true;
    area.autoZoomOut = true;
    area.targetImage = target;
    areaRef.current = area;

    const syncSelection = () => setSelectedCount(area.selectedMarkerEditors.length);
    const syncHistory = () => setHistory({ canUndo: area.isUndoPossible, canRedo: area.isRedoPossible });

    area.addEventListener("areashow", () => area.autoZoom());
    area.addEventListener("markerselect", syncSelection);
    area.addEventListener("markerdeselect", syncSelection);
    area.addEventListener("markerdelete", syncSelection);
    area.addEventListener("areastatechange", syncHistory);
    area.addEventListener("arearestorestate", syncHistory);
    // Les nouveaux marqueurs prennent le style courant…
    area.addEventListener("markercreating", (ev) => applyMarkerStyle(ev.detail.markerEditor, styleRef.current));
    // …et l'outil se désactive une fois le marqueur posé.
    area.addEventListener("markercreate", () => {
      setActiveTool(null);
      syncHistory();
    });

    host.appendChild(area);
    if (initial) {
      try {
        area.restoreState(initial, false);
      } catch {
        // état ancien ou incompatible : on repart d'une annotation vierge
      }
    }

    const resize = new ResizeObserver(() => area.autoZoom());
    resize.observe(host);

    return () => {
      resize.disconnect();
      area.remove();
      areaRef.current = null;
    };
    // L'éditeur est monté une fois par ouverture ; `initial` n'est lu qu'au montage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostRef, image]);

  const createMarker = useCallback((type: string) => {
    const area = areaRef.current;
    if (!area) return;
    area.createMarker(type);
    setActiveTool(type);
  }, []);

  const selectMode = useCallback(() => {
    areaRef.current?.switchToSelectMode();
    setActiveTool(null);
  }, []);

  /** Change le style courant et l'applique à la sélection. */
  const setStyle = useCallback((patch: Partial<MarkerStyle>) => {
    styleRef.current = { ...styleRef.current, ...patch };
    setStyleState(styleRef.current);
    areaRef.current?.selectedMarkerEditors.forEach((ed) => applyMarkerStyle(ed, patch));
  }, []);

  const deleteSelected = useCallback(() => {
    areaRef.current?.deleteSelectedMarkers();
    setSelectedCount(0);
  }, []);

  const undo = useCallback(() => areaRef.current?.undo(), []);
  const redo = useCallback(() => areaRef.current?.redo(), []);

  /** État courant de l'annotation (sélection retirée pour ne pas figer les poignées). */
  const getState = useCallback((): AnnotationState | null => {
    const area = areaRef.current;
    if (!area) return null;
    area.switchToSelectMode();
    return area.getState();
  }, []);

  return {
    style,
    setStyle,
    activeTool,
    createMarker,
    selectMode,
    selectedCount,
    deleteSelected,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    undo,
    redo,
    getState,
  };
}

export type MarkerAreaControls = ReturnType<typeof useMarkerArea>;
