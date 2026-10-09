import { Button, Modal } from "@heroui/react";
import { BellRing } from "lucide-react";
import { fireAlarmNotification } from "@/lib/alarm";
import { dismissAlert, snoozeAlert, useAlerts } from "@/lib/alertOverlay";

const SNOOZE_MINUTES = 5;

/** Alertes au premier plan (rappels du calendrier…), à acquitter explicitement. */
export function AlertOverlay() {
  const alerts = useAlerts();

  return (
    <Modal isOpen={alerts.length > 0}>
      <Modal.Backdrop isDismissable={false} isKeyboardDismissDisabled>
        <Modal.Container size="sm" placement="center">
          <Modal.Dialog aria-label="Rappel">
            <Modal.Header>
              <Modal.Heading className="flex items-center gap-2">
                <BellRing className="size-4 animate-pulse text-danger" />
                {alerts.length > 1 ? `${alerts.length} rappels` : "Rappel"}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
              {alerts.map((a) => (
                <div key={a.id} className="flex flex-col gap-2 rounded-xl bg-surface-secondary p-3">
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-1.5 size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: a.color ?? "var(--accent)" }}
                    />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-[1.0741rem] font-semibold break-words">{a.title}</span>
                      {a.subtitle && <span className="text-xs text-muted tabular-nums">{a.subtitle}</span>}
                      {a.body && <p className="mt-1 text-[0.9259rem] whitespace-pre-wrap">{a.body}</p>}
                    </div>
                  </div>
                  <div className="flex justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="secondary"
                      onPress={() =>
                        snoozeAlert(a.id, SNOOZE_MINUTES, (fired) =>
                          void fireAlarmNotification(`Rappel · ${fired.title}`, fired.subtitle ?? "", { sound: true }),
                        )
                      }
                    >
                      Rappeler dans {SNOOZE_MINUTES} min
                    </Button>
                    <Button size="sm" variant="primary" autoFocus onPress={() => dismissAlert(a.id)}>
                      OK
                    </Button>
                  </div>
                </div>
              ))}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
