import { Modal } from "@heroui/react";
import type { AnnotationState } from "@markerjs/markerjs3";
import { AnnotateEditor } from "./AnnotateEditor";

type AnnotateModalProps = {
  isOpen: boolean;
  image: string;
  markerState: AnnotationState | null;
  onSave: (markerState: AnnotationState | null, rendered: string | null) => void;
  onClose: () => void;
};

/**
 * Fenêtre plein écran d'annotation. Ni clic extérieur ni Échap ne la ferment,
 * pour ne pas perdre un travail en cours.
 */
export function AnnotateModal({ isOpen, image, markerState, onSave, onClose }: AnnotateModalProps) {
  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Backdrop isDismissable={false} isKeyboardDismissDisabled>
        <Modal.Container size="cover">
          <Modal.Dialog className="flex flex-col gap-3" aria-label="Annoter l'image">
            {isOpen && (
              <AnnotateEditor
                image={image}
                markerState={markerState}
                onSave={(state, rendered) => {
                  onSave(state, rendered);
                  onClose();
                }}
                onCancel={onClose}
              />
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
