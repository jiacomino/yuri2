import { Button, Modal } from "@heroui/react";
import { TriangleAlert } from "lucide-react";

export type ConfirmRequest = {
  title: string;
  message: string;
  confirmLabel?: string;
  /** Bouton de confirmation rouge (suppression). */
  danger?: boolean;
};

type ConfirmModalProps = {
  request: ConfirmRequest | null;
  onResolve: (ok: boolean) => void;
};

/** Boîte de confirmation contrôlée ; ouverte tant que `request` est non nul. */
export function ConfirmModal({ request, onResolve }: ConfirmModalProps) {
  return (
    <Modal
      isOpen={request !== null}
      onOpenChange={(open) => {
        if (!open) onResolve(false);
      }}
    >
      <Modal.Backdrop>
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.Header className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-xl bg-warning/15 text-warning">
                <TriangleAlert className="size-4" />
              </span>
              <Modal.Heading>{request?.title}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="text-sm text-muted">{request?.message}</p>
            </Modal.Body>
            <Modal.Footer>
              <Button size="sm" variant="secondary" onPress={() => onResolve(false)}>
                Annuler
              </Button>
              <Button
                size="sm"
                variant={request?.danger ? "danger" : "primary"}
                onPress={() => onResolve(true)}
                autoFocus
              >
                {request?.confirmLabel ?? "Confirmer"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
