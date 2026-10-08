import { Button, Input, Label, Modal, Switch, TextArea } from "@heroui/react";
import { Trash2 } from "lucide-react";
import { AppPicker } from "./AppPicker";
import { ColorDots } from "./ColorDots";
import { allDayBounds } from "./dates";
import { EditorSection as Section } from "./EditorSection";
import { EventDateFields } from "./EventDateFields";
import { PriorityPicker } from "./PriorityPicker";
import type { AppTag, CalendarTask } from "./state";

type EventEditorModalProps = {
  task: CalendarTask | null;
  apps: AppTag[];
  onPatch: (id: string, patch: Partial<CalendarTask>) => void;
  onCreateApp: (name: string, color: string) => string | undefined;
  onDelete: (id: string) => void;
  onClose: () => void;
};

/** Édition d'une tâche ; chaque modification est appliquée immédiatement. */
export function EventEditorModal({ task, apps, onPatch, onCreateApp, onDelete, onClose }: EventEditorModalProps) {
  return (
    <Modal
      isOpen={!!task}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Modal.Backdrop>
        <Modal.Container size="md" placement="center">
          <Modal.Dialog aria-label="Modifier la tâche">
            {task && (
              <>
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Heading>{task.title.trim() ? "Modifier la tâche" : "Nouvelle tâche"}</Modal.Heading>
                </Modal.Header>
                <Modal.Body className="flex flex-col gap-3">
                  <Input
                    autoFocus
                    aria-label="Titre de la tâche"
                    value={task.title}
                    onChange={(e) => onPatch(task.id, { title: e.currentTarget.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onClose();
                    }}
                    placeholder="Titre de la tâche"
                    className="text-[1rem]"
                  />

                  <Section label="Priorité">
                    <PriorityPicker value={task.priority} onChange={(priority) => onPatch(task.id, { priority })} />
                  </Section>

                  <Section label="Application">
                    <AppPicker
                      apps={apps}
                      value={task.appId}
                      onChange={(appId) => onPatch(task.id, { appId })}
                      onCreate={onCreateApp}
                    />
                  </Section>

                  <Section label={task.appId ? "Couleur (si sans application)" : "Couleur"}>
                    <ColorDots value={task.color} onChange={(color) => onPatch(task.id, { color })} />
                  </Section>

                  <Section
                    label="Horaire"
                    aside={
                      <Switch
                        size="sm"
                        isSelected={task.allDay}
                        onChange={(allDay) => onPatch(task.id, { allDay, ...allDayBounds(task.start, allDay) })}
                      >
                        <Switch.Content>
                          <Switch.Control>
                            <Switch.Thumb />
                          </Switch.Control>
                          <Label className="text-xs">Journée entière</Label>
                        </Switch.Content>
                      </Switch>
                    }
                  >
                    <EventDateFields
                      start={task.start}
                      end={task.end}
                      allDay={task.allDay}
                      onChange={(patch) => onPatch(task.id, patch)}
                    />
                  </Section>

                  <Section label="Notes">
                    <TextArea
                      aria-label="Notes"
                      rows={3}
                      value={task.notes}
                      onChange={(e) => onPatch(task.id, { notes: e.currentTarget.value })}
                      placeholder="Notes…"
                      className="w-full resize-y text-[0.9259rem]"
                    />
                  </Section>
                </Modal.Body>
                <Modal.Footer className="flex items-center">
                  <Button size="sm" variant="danger-soft" onPress={() => onDelete(task.id)}>
                    <Trash2 className="size-3.5" />
                    Supprimer
                  </Button>
                  <span className="flex-1" />
                  <Button size="sm" variant="primary" onPress={onClose}>
                    Terminé
                  </Button>
                </Modal.Footer>
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
