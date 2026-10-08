type ColorInputProps = {
  value: string;
  onChange: (color: string) => void;
  label: string;
};

/** Sélecteur de couleur natif présenté comme une pastille ronde. */
export function ColorInput({ value, onChange, label }: ColorInputProps) {
  return (
    <input
      type="color"
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      aria-label={label}
      title={label}
      className="cal-color-input size-6 shrink-0 cursor-pointer"
    />
  );
}
