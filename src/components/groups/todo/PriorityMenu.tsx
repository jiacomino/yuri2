import { Button, Dropdown, Label } from "@heroui/react";
import { Check, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIORITIES, priorityConfig } from "./priorities";
import type { TodoPriority } from "./state";

type PriorityMenuProps = {
  priority?: TodoPriority;
  onChange: (priority: TodoPriority | undefined) => void;
  className?: string;
};

/** Drapeau de priorité + menu de choix. */
export function PriorityMenu({ priority, onChange, className }: PriorityMenuProps) {
  const cfg = priorityConfig(priority);
  const current = priority ?? "none";

  return (
    <Dropdown>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label={`Priorité : ${cfg.label}`}
        className={cn("size-6 min-w-6", priority ? cfg.color : "text-muted", className)}
      >
        {priority ? (
          <span className={cn("size-2 rounded-full", cfg.dot)} />
        ) : (
          <Flag className="size-3.5" />
        )}
      </Button>
      <Dropdown.Popover placement="bottom end" className="min-w-40">
        <Dropdown.Menu
          aria-label="Priorité"
          onAction={(key) => {
            const id = String(key);
            onChange(id === "none" ? undefined : (id as TodoPriority));
          }}
        >
          {PRIORITIES.map((p) => (
            <Dropdown.Item key={p.id} id={p.id} textValue={p.label}>
              <Flag className={cn("size-3.5", p.color, p.id !== "none" && "fill-current")} />
              <Label className="flex-1">{p.label}</Label>
              {current === p.id && <Check className="size-3.5 text-muted" />}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
