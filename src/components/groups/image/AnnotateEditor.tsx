import { useRef, useState } from "react";
import { Button, Modal } from "@heroui/react";
import type { AnnotationState } from "@markerjs/markerjs3";
import { notify } from "@/lib/notify";
import { renderAnnotated } from "./imageFiles";
import { MarkerToolbar } from "./MarkerToolbar";
import { useMarkerArea } from "./useMarkerArea";

type AnnotateEditorProps = {
  image: string;
  markerState: AnnotationState | null;
  onSave: (markerState: AnnotationState | null, rendered: string | null) => void;
  onCancel: () => void;
};

/** Contenu de la fenêtre d'annotation : barre d'outils, zone marker.js et actions. */
export function AnnotateEditor({ image, markerState, onSave, onCancel }: AnnotateEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const controls = useMarkerArea(hostRef, image, markerState);
  const [saving, setSaving] = useState(false);

  async function save() {
    const state = controls.getState();
    if (!state) return;
    if (state.markers.length === 0) {
      onSave(null, null);
      return;
    }
    setSaving(true);
    try {
      onSave(state, await renderAnnotated(image, state));
    } catch (err) {
      notify({ title: "Échec du rendu de l'image", body: String(err) });
      setSaving(false);
    }
  }

  return (
    <>
      <Modal.Header>
        <Modal.Heading>Annoter l'image</Modal.Heading>
      </Modal.Header>
      <Modal.Body className="flex min-h-0 flex-col gap-2">
        <MarkerToolbar controls={controls} />
        <div
          ref={hostRef}
          className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-surface-secondary bg-[radial-gradient(circle,var(--border)_1px,transparent_1px)] [background-size:16px_16px]"
        />
        <p className="text-xs text-muted">
          Choisissez un outil puis tracez sur l'image · double-clic sur un texte pour le modifier · Suppr pour effacer
          la sélection.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button size="sm" variant="secondary" onPress={onCancel} isDisabled={saving}>
          Annuler
        </Button>
        <Button size="sm" variant="primary" onPress={() => void save()} isPending={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </Modal.Footer>
    </>
  );
}
