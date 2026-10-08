import { Modal } from "@heroui/react";
import { CredentialsForm } from "./CredentialsForm";

type CredentialsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
};

/** Modification ultérieure des identifiants OAuth. */
export function CredentialsModal({ isOpen, onClose, onSaved }: CredentialsModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Modal.Backdrop>
        <Modal.Container size="sm" placement="center">
          <Modal.Dialog aria-label="Identifiants Google">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Identifiants Google</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              {isOpen && (
                <CredentialsForm
                  onCancel={onClose}
                  onSaved={() => {
                    onSaved();
                    onClose();
                  }}
                />
              )}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
