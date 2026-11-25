/** Petits composants de formulaire de l'import / export (repris de YuriExport), sur HeroUI v3. */
import { useState, type KeyboardEvent, type ReactNode } from "react";
import { Button, Checkbox, Description, Input, Label, ListBox, Modal, Select, Switch, TextField } from "@heroui/react";
import { open } from "@tauri-apps/plugin-dialog";
import { FolderOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  description,
  type = "text",
  isRequired,
  className,
  inputClassName,
  autoFocus,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  description?: ReactNode;
  type?: "text" | "password" | "number";
  isRequired?: boolean;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
}) {
  return (
    <TextField
      value={value}
      onChange={onChange}
      type={type}
      isRequired={isRequired}
      className={cn("flex flex-col gap-1", className)}
      aria-label={label ? undefined : placeholder}
      autoFocus={autoFocus}
    >
      {label && <Label>{label}</Label>}
      <Input placeholder={placeholder} className={inputClassName} spellCheck={false} />
      {description && <Description>{description}</Description>}
    </TextField>
  );
}

/** Champ de chemin avec bouton « Parcourir » (fichier ou dossier). */
export function PathInput({
  label,
  value,
  onChange,
  placeholder,
  description,
  directory,
  filters,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  description?: ReactNode;
  directory?: boolean;
  filters?: { name: string; extensions: string[] }[];
}) {
  async function browse() {
    const picked = await open({ directory, multiple: false, filters, defaultPath: value || undefined });
    if (typeof picked === "string") onChange(picked);
  }
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-end gap-2">
        <TextInput
          label={label}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="min-w-0 flex-1"
          inputClassName="font-mono text-xs"
        />
        <Button variant="secondary" onPress={() => void browse()}>
          <FolderOpen className="size-4" />
          Parcourir
        </Button>
      </div>
      {description && <p className="text-[0.8148rem] text-muted">{description}</p>}
    </div>
  );
}

export function Toggle({
  label,
  description,
  isSelected,
  onChange,
  isDisabled,
}: {
  label: string;
  description?: ReactNode;
  isSelected: boolean;
  onChange: (v: boolean) => void;
  isDisabled?: boolean;
}) {
  return (
    <Switch size="sm" isSelected={isSelected} onChange={onChange} isDisabled={isDisabled}>
      <Switch.Content>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <div className="flex flex-col">
          <Label>{label}</Label>
          {description && <span className="text-[0.8148rem] text-muted">{description}</span>}
        </div>
      </Switch.Content>
    </Switch>
  );
}

export function CheckOption({
  label,
  hint,
  isSelected,
  onChange,
}: {
  label: ReactNode;
  hint?: ReactNode;
  isSelected: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Checkbox isSelected={isSelected} onChange={onChange} className="rounded-[10px] px-2 py-1.5 hover:bg-surface-secondary">
      <Checkbox.Content className="flex w-full items-start gap-2.5">
        <Checkbox.Control className="mt-0.5">
          <Checkbox.Indicator />
        </Checkbox.Control>
        <div className="flex min-w-0 flex-col">
          <Label className="text-[0.963rem]">{label}</Label>
          {hint && <span className="text-[0.8148rem] text-muted">{hint}</span>}
        </div>
      </Checkbox.Content>
    </Checkbox>
  );
}

export type SelectItem = { id: string; label: string; color?: string };

export function SelectBox({
  label,
  value,
  onChange,
  items,
  placeholder = "Choisir…",
  className,
}: {
  label?: string;
  value: string | null;
  onChange: (v: string) => void;
  items: SelectItem[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <Select
      aria-label={label ?? placeholder}
      value={value && items.some((i) => i.id === value) ? value : null}
      onChange={(k) => k != null && onChange(String(k))}
      placeholder={placeholder}
      className={cn("flex flex-col gap-1", className)}
    >
      {label && <Label>{label}</Label>}
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {items.map((it) => (
            <ListBox.Item key={it.id} id={it.id} textValue={it.label}>
              {it.color && <ColorDot color={it.color} />}
              <span className="min-w-0 flex-1 truncate">{it.label}</span>
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

export function ColorDot({ color, className }: { color: string; className?: string }) {
  return <span aria-hidden className={cn("size-2.5 shrink-0 rounded-full", className)} style={{ background: color }} />;
}

/** Pastille colorée (environnement, application). */
export function Badge({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span
      className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[0.8148rem] font-semibold"
      style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}
    >
      {children}
    </span>
  );
}

/** Saisie d'une liste de valeurs (Entrée, virgule ou espace pour valider). */
export function TagListInput({
  label,
  value,
  onChange,
  placeholder,
  description,
  isDisabled,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  description?: ReactNode;
  isDisabled?: boolean;
}) {
  const [draft, setDraft] = useState("");

  function commit(text: string) {
    const parts = text
      .split(/[\s,;]+/)
      .map((p) => p.trim())
      .filter(Boolean)
      .filter((p) => !value.includes(p));
    if (parts.length) onChange([...value, ...parts]);
    setDraft("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (["Enter", ",", ";", " "].includes(e.key)) {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className={cn("flex flex-col gap-1", isDisabled && "pointer-events-none opacity-50")}>
      <span className="text-[0.963rem] font-medium">{label}</span>
      <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-xl bg-field px-2 py-1.5 ring-1 ring-field-border focus-within:ring-2 focus-within:ring-accent/40">
        {value.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-md bg-default px-1.5 py-0.5 font-mono text-[0.8148rem]">
            {v}
            <button type="button" aria-label={`Retirer ${v}`} className="text-muted hover:text-foreground" onClick={() => onChange(value.filter((x) => x !== v))}>
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.currentTarget.value)}
          onKeyDown={onKeyDown}
          onBlur={() => draft && commit(draft)}
          onPaste={(e) => {
            e.preventDefault();
            commit(draft + e.clipboardData.getData("text"));
          }}
          placeholder={value.length ? "" : placeholder}
          className="min-w-24 flex-1 bg-transparent text-[0.963rem] outline-none placeholder:text-muted"
          aria-label={label}
          spellCheck={false}
        />
      </div>
      {description && <p className="text-[0.8148rem] text-muted">{description}</p>}
    </div>
  );
}

export function Notice({ tone, icon, children }: { tone: "success" | "warning" | "danger"; icon?: ReactNode; children: ReactNode }) {
  const cls = { success: "bg-success/10 text-success", warning: "bg-warning/10 text-warning", danger: "bg-danger/10 text-danger" }[tone];
  return (
    <div className={`flex items-start gap-2 rounded-xl px-3 py-2 text-[0.8889rem] ${cls}`}>
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** Titre de section d'un formulaire long (une seule page, sans onglets). */
export function SectionTitle({ children, first }: { children: ReactNode; first?: boolean }) {
  return (
    <h3 className={cn("text-[0.7407rem] font-bold tracking-[0.08em] text-muted uppercase", !first && "mt-4 border-t border-separator pt-5")}>
      {children}
    </h3>
  );
}

/**
 * Confirmation avec contenu riche. `typeToConfirm` : texte à recopier pour activer le
 * bouton (environnement sensible).
 */
export function ConfirmDialog({
  isOpen,
  title,
  children,
  confirmLabel = "Confirmer",
  danger,
  typeToConfirm,
  onConfirm,
  onClose,
}: {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  typeToConfirm?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [typed, setTyped] = useState("");
  const blocked = !!typeToConfirm && typed.trim() !== typeToConfirm.trim();
  const close = () => {
    setTyped("");
    onClose();
  };
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(o) => !o && close()}>
      <Modal.Container size="md">
        <Modal.Dialog aria-label={title}>
          <Modal.Header>
            <Modal.Heading>{title}</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-3 text-[0.963rem]">
            {children}
            {typeToConfirm && (
              <TextInput
                label={`Tapez « ${typeToConfirm} » pour confirmer`}
                value={typed}
                onChange={setTyped}
                placeholder={typeToConfirm}
                autoFocus
              />
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button size="sm" variant="secondary" onPress={close}>
              Annuler
            </Button>
            <Button
              size="sm"
              variant={danger ? "danger" : "primary"}
              isDisabled={blocked}
              onPress={() => {
                onConfirm();
                close();
              }}
              autoFocus={!typeToConfirm}
            >
              {confirmLabel}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
