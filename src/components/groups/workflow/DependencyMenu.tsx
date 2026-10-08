import { Button, Dropdown, Header, Label } from "@heroui/react";
import { Link2 } from "lucide-react";
import { useWorkflow } from "./context";
import { dependsTransitively, type WorkflowAction } from "./state";

const NONE_KEY = "__aucune";

/** Choix des prérequis (« Bloquée par ») ; le menu reste ouvert pour cocher en série. */
export function DependencyMenu({ action }: { action: WorkflowAction }) {
  const { state, ops } = useWorkflow();
  const others = state.actions.filter((a) => a.id !== action.id);
  // Un prérequis qui dépend déjà de cette action fermerait une boucle : on le grise.
  const loops = others
    .filter((a) => !action.dependsOn.includes(a.id) && dependsTransitively(state.actions, a.id, action.id))
    .map((a) => a.id);
  const count = action.dependsOn.length;

  return (
    <Dropdown>
      <Button size="sm" variant="outline">
        <Link2 className="size-3.5" />
        Bloquée par{count > 0 && ` (${count})`}
      </Button>
      <Dropdown.Popover placement="bottom start" className="max-h-72 w-72 overflow-y-auto">
        <Dropdown.Menu
          aria-label="Prérequis"
          selectionMode="multiple"
          shouldCloseOnSelect={false}
          selectedKeys={new Set(action.dependsOn)}
          disabledKeys={[...loops, NONE_KEY]}
          onSelectionChange={(keys) => {
            if (keys === "all") return;
            const next = new Set(Array.from(keys, String));
            for (const id of others.map((a) => a.id)) {
              if (next.has(id) !== action.dependsOn.includes(id)) ops.toggleDependency(action.id, id);
            }
          }}
        >
          <Dropdown.Section>
            <Header>Prérequis</Header>
            {others.length === 0 && (
              <Dropdown.Item key={NONE_KEY} id={NONE_KEY} textValue="Aucune autre action">
                <Label className="text-muted">Aucune autre action</Label>
              </Dropdown.Item>
            )}
            {others.map((a) => (
              <Dropdown.Item key={a.id} id={a.id} textValue={a.title}>
                <Dropdown.ItemIndicator />
                <Label className="truncate">{a.title}</Label>
              </Dropdown.Item>
            ))}
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
