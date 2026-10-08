import { Button, Dropdown, Label } from "@heroui/react";
import { ChevronDown } from "lucide-react";
import { ESTIMATES } from "./state";

type EstimateMenuProps = {
  value: number;
  onChange: (minutes: number) => void;
};

/** Sélecteur compact d'estimation (formulaire d'ajout). */
export function EstimateMenu({ value, onChange }: EstimateMenuProps) {
  return (
    <Dropdown>
      <Button size="sm" variant="secondary" aria-label="Estimation" className="shrink-0 tabular-nums">
        {value} min
        <ChevronDown className="size-3.5" />
      </Button>
      <Dropdown.Popover placement="bottom end">
        <Dropdown.Menu
          aria-label="Estimation"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[String(value)]}
          onSelectionChange={(keys) => {
            if (keys === "all") return;
            const [first] = keys;
            if (first !== undefined) onChange(Number(first));
          }}
        >
          {ESTIMATES.map((m) => (
            <Dropdown.Item key={m} id={String(m)} textValue={`${m} min`}>
              <Label className="tabular-nums">{m} min</Label>
              <Dropdown.ItemIndicator />
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
