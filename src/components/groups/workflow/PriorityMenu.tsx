import { Button, Dropdown, Header, Label } from "@heroui/react";
import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIORITY_META } from "./priority";
import { PRIORITY_ORDER, type Priority } from "./state";

type PriorityMenuProps = {
  value: Priority;
  onChange: (priority: Priority) => void;
  /** `icon` : drapeau seul (ligne compacte) ; `button` : drapeau + libellé (détails). */
  variant?: "icon" | "button";
};

/** Choix de la priorité en un clic, sans ouvrir les détails. */
export function PriorityMenu({ value, onChange, variant = "icon" }: PriorityMenuProps) {
  const meta = PRIORITY_META[value];
  return (
    <Dropdown>
      {variant === "icon" ? (
        <Button isIconOnly size="sm" variant="ghost" aria-label={`Priorité : ${meta.label}`} className="size-7 min-w-7 shrink-0">
          <Flag className={cn("size-3.5", meta.text)} />
        </Button>
      ) : (
        <Button size="sm" variant="outline" aria-label="Changer la priorité">
          <Flag className={cn("size-3.5", meta.text)} />
          {meta.label}
        </Button>
      )}
      <Dropdown.Popover placement="bottom start">
        <Dropdown.Menu
          aria-label="Priorité"
          selectionMode="single"
          selectedKeys={new Set([value])}
          onAction={(key) => onChange(key as Priority)}
        >
          <Dropdown.Section>
            <Header>Priorité</Header>
            {PRIORITY_ORDER.map((p) => (
              <Dropdown.Item key={p} id={p} textValue={PRIORITY_META[p].label}>
                <Flag className={cn("size-3.5", PRIORITY_META[p].text)} />
                <Label>{PRIORITY_META[p].label}</Label>
                <Dropdown.ItemIndicator />
              </Dropdown.Item>
            ))}
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
