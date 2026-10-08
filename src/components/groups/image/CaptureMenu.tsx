import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button, Description, Dropdown, Header, Label, Spinner } from "@heroui/react";
import { AppWindow, Camera, Monitor } from "lucide-react";

type CaptureTarget = { kind: "monitor" | "window"; id: number; label: string; detail: string };

type CaptureMenuProps = {
  hasImage: boolean;
  /** Reçoit la capture (data URL PNG). */
  onCapture: (dataUrl: string) => void;
  onError: (err: unknown) => void;
};

/**
 * Bouton « Capturer » : liste les écrans et fenêtres ouverts (relue à chaque ouverture) et
 * capture celui choisi. yuri2 se masque le temps de la prise.
 */
export function CaptureMenu({ hasImage, onCapture, onError }: CaptureMenuProps) {
  const [targets, setTargets] = useState<CaptureTarget[] | null>(null);
  const [busy, setBusy] = useState(false);

  function load() {
    setTargets(null);
    invoke<CaptureTarget[]>("list_capture_targets")
      .then(setTargets)
      .catch((err) => {
        setTargets([]);
        onError(err);
      });
  }

  async function capture(key: string) {
    const target = targets?.find((t) => `${t.kind}:${t.id}` === key);
    if (!target) return;
    setBusy(true);
    try {
      onCapture(await invoke<string>("capture_target", { kind: target.kind, id: target.id }));
    } catch (err) {
      onError(err);
    } finally {
      setBusy(false);
    }
  }

  const monitors = targets?.filter((t) => t.kind === "monitor") ?? [];
  const windows = targets?.filter((t) => t.kind === "window") ?? [];

  return (
    <Dropdown onOpenChange={(open) => open && load()}>
      <Button size="sm" variant={hasImage ? "ghost" : "secondary"} isPending={busy}>
        <Camera className="size-3.5" />
        Capturer
      </Button>
      <Dropdown.Popover placement="bottom start" className="max-h-96 max-w-sm">
        {targets === null ? (
          <div className="grid place-items-center p-4">
            <Spinner size="sm" />
          </div>
        ) : (
          <Dropdown.Menu aria-label="Que capturer ?" onAction={(key) => void capture(String(key))}>
            <Dropdown.Section>
              <Header>Écran entier</Header>
              {monitors.map((t) => (
                <TargetItem key={`${t.kind}:${t.id}`} target={t} />
              ))}
            </Dropdown.Section>
            {windows.length > 0 && (
              <Dropdown.Section>
                <Header>Fenêtre</Header>
                {windows.map((t) => (
                  <TargetItem key={`${t.kind}:${t.id}`} target={t} />
                ))}
              </Dropdown.Section>
            )}
          </Dropdown.Menu>
        )}
      </Dropdown.Popover>
    </Dropdown>
  );
}

function TargetItem({ target }: { target: CaptureTarget }) {
  const Icon = target.kind === "monitor" ? Monitor : AppWindow;
  return (
    <Dropdown.Item id={`${target.kind}:${target.id}`} textValue={target.label}>
      <Icon className="size-3.5 shrink-0" />
      <div className="flex min-w-0 flex-col">
        <Label className="truncate">{target.label}</Label>
        {target.detail && <Description className="truncate">{target.detail}</Description>}
      </div>
    </Dropdown.Item>
  );
}
