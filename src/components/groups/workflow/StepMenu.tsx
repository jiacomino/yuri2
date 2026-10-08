import { Button, Dropdown, Header, Label } from "@heroui/react";
import { useWorkflow } from "./context";
import { stepColor, type WorkflowAction } from "./state";
import { Dot } from "./ui";

/** Bouton teinté de l'étape courante ; ouvre « Déplacer vers ». */
export function StepMenu({ action }: { action: WorkflowAction }) {
  const { state, ops } = useWorkflow();
  const steps = state.steps;
  const current = steps.find((s) => s.id === action.stepId);
  const color = current ? stepColor(steps, current) : undefined;

  return (
    <Dropdown>
      <Button size="sm" variant="outline" style={color ? { color, borderColor: `${color}59` } : undefined}>
        {color && <Dot color={color} />}
        {current?.name ?? "Étape"}
      </Button>
      <Dropdown.Popover placement="bottom start">
        <Dropdown.Menu
          aria-label="Déplacer vers"
          disabledKeys={[action.stepId]}
          onAction={(key) => ops.moveToStep(action.id, String(key))}
        >
          <Dropdown.Section>
            <Header>Déplacer vers</Header>
            {steps.map((s) => (
              <Dropdown.Item key={s.id} id={s.id} textValue={s.name}>
                <Dot color={stepColor(steps, s)} className="size-2" />
                <Label>{s.name}</Label>
              </Dropdown.Item>
            ))}
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
