import { Button } from "@heroui/react";
import { Download, Eraser, ImageUp, Pencil, Trash2 } from "lucide-react";
import { CaptureMenu } from "./CaptureMenu";

type ImageToolbarProps = {
  hasImage: boolean;
  hasAnnotations: boolean;
  exporting: boolean;
  onPick: () => void;
  onCapture: (dataUrl: string) => void;
  onCaptureError: (err: unknown) => void;
  onAnnotate: () => void;
  onExport: () => void;
  onClearAnnotations: () => void;
  onRemove: () => void;
};

/** Actions du groupe image : charger, capturer l'écran, annoter, exporter, effacer, supprimer. */
export function ImageToolbar({
  hasImage,
  hasAnnotations,
  exporting,
  onPick,
  onCapture,
  onCaptureError,
  onAnnotate,
  onExport,
  onClearAnnotations,
  onRemove,
}: ImageToolbarProps) {
  return (
    <div className="flex shrink-0 items-center gap-1 pb-2.5">
      <Button size="sm" variant={hasImage ? "ghost" : "secondary"} onPress={onPick}>
        <ImageUp className="size-3.5" />
        {hasImage ? "Changer" : "Charger"}
      </Button>
      <CaptureMenu hasImage={hasImage} onCapture={onCapture} onError={onCaptureError} />

      {hasImage && (
        <>
          <Button size="sm" variant="secondary" onPress={onAnnotate}>
            <Pencil className="size-3.5" />
            Annoter
          </Button>
          <Button size="sm" variant="ghost" onPress={onExport} isPending={exporting}>
            <Download className="size-3.5" />
            {exporting ? "Export…" : "Exporter"}
          </Button>
          <span className="flex-1" />
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label="Effacer les annotations"
            isDisabled={!hasAnnotations}
            onPress={onClearAnnotations}
          >
            <Eraser className="size-3.5" />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label="Supprimer l'image"
            className="text-danger"
            onPress={onRemove}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </>
      )}
    </div>
  );
}
