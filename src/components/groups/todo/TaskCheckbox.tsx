import { Checkbox } from "@heroui/react";
import { cn } from "@/lib/utils";

type TaskCheckboxProps = {
  isSelected: boolean;
  onChange: () => void;
  label: string;
  small?: boolean;
};

/** Case à cocher HeroUI sans libellé visible. */
export function TaskCheckbox({ isSelected, onChange, label, small }: TaskCheckboxProps) {
  return (
    <Checkbox
      isSelected={isSelected}
      onChange={onChange}
      aria-label={isSelected ? `Décocher ${label}` : `Cocher ${label}`}
      className="shrink-0"
    >
      <Checkbox.Content>
        <Checkbox.Control className={cn(small ? "size-3.5 rounded-[4px]" : "size-[17px] rounded-[5px]")}>
          <Checkbox.Indicator />
        </Checkbox.Control>
      </Checkbox.Content>
    </Checkbox>
  );
}
