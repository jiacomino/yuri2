import { Label, Switch } from "@heroui/react";

type SettingToggleProps = {
  label: string;
  isSelected: boolean;
  onChange: (value: boolean) => void;
};

export function SettingToggle({ label, isSelected, onChange }: SettingToggleProps) {
  return (
    <Switch size="sm" isSelected={isSelected} onChange={onChange}>
      <Switch.Content>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Label className="text-xs">{label}</Label>
      </Switch.Content>
    </Switch>
  );
}
