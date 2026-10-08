import { Label, NumberField } from "@heroui/react";

type MinutesFieldProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

/** Champ numérique compact avec boutons −/+ (réglages du pomodoro). */
export function MinutesField({ label, value, min, max, onChange }: MinutesFieldProps) {
  return (
    <NumberField
      value={value}
      minValue={min}
      maxValue={max}
      step={1}
      onChange={(v) => {
        if (Number.isFinite(v)) onChange(Math.round(Math.min(max, Math.max(min, v))));
      }}
      className="flex flex-col gap-1"
    >
      <Label className="text-[0.8889rem] font-semibold text-muted">{label}</Label>
      <NumberField.Group>
        <NumberField.DecrementButton />
        <NumberField.Input className="w-12 text-center tabular-nums" />
        <NumberField.IncrementButton />
      </NumberField.Group>
    </NumberField>
  );
}
