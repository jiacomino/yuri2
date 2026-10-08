import type { AnnotationState } from "@markerjs/markerjs3";

export type ImageState = {
  /** Image d'origine (data URL, sans annotations) : base de toute ré-édition. */
  image: string | null;
  /** État marker.js 3 (JSON) pour restaurer les annotations à la réouverture. */
  markerState: AnnotationState | null;
  /** Aperçu aplati (image + annotations) affiché dans le groupe et exporté. */
  rendered: string | null;
};

export function defaultState(): ImageState {
  return { image: null, markerState: null, rendered: null };
}

/** Pas d'image d'exemple : la galerie montre l'invite de chargement. */
export function demoState(): ImageState {
  return defaultState();
}
