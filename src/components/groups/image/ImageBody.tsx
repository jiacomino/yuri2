import { useRef, useState, type DragEvent } from "react";
import type { AnnotationState } from "@markerjs/markerjs3";
import { confirm } from "@tauri-apps/plugin-dialog";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";
import type { BodyProps } from "../types";
import { AnnotateModal } from "./AnnotateModal";
import { exportDataUrl, fileToDataUrl } from "./imageFiles";
import { ImageDropZone } from "./ImageDropZone";
import { ImageToolbar } from "./ImageToolbar";
import { defaultState, type ImageState } from "./state";

/** Corps du groupe « Image annotée » : chargement ou capture d'écran, annotation marker.js 3 et export PNG. */
export function ImageBody({ value, onChange }: BodyProps<ImageState>) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [editing, setEditing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const displaySrc = value.rendered ?? value.image;
  const hasAnnotations = !!value.markerState || !!value.rendered;

  const pick = () => fileInputRef.current?.click();

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notify({ title: "Format non pris en charge", body: "Choisissez un fichier image (PNG, JPEG, WebP…)." });
      return;
    }
    if (!(await confirmReplace())) return;
    try {
      // Une nouvelle image invalide les annotations précédentes.
      onChange({ image: await fileToDataUrl(file), markerState: null, rendered: null });
    } catch (err) {
      notify({ title: "Lecture de l'image impossible", body: String(err) });
    }
  }

  /** Remplacer une image annotée fait perdre les annotations : on demande d'abord. */
  async function confirmReplace(): Promise<boolean> {
    if (!value.image || !hasAnnotations) return true;
    return confirm("Remplacer l'image ? Les annotations actuelles seront perdues.", {
      title: "Confirmer",
      kind: "warning",
    });
  }

  async function handleCapture(dataUrl: string) {
    if (await confirmReplace()) onChange({ image: dataUrl, markerState: null, rendered: null });
  }

  function saveAnnotations(markerState: AnnotationState | null, rendered: string | null) {
    onChange({ ...value, markerState, rendered });
  }

  async function clearAnnotations() {
    if (!hasAnnotations) return;
    const ok = await confirm("Effacer toutes les annotations de cette image ?", {
      title: "Confirmer",
      kind: "warning",
    });
    if (ok) onChange({ ...value, markerState: null, rendered: null });
  }

  async function removeImage() {
    const ok = await confirm("Supprimer l'image et ses annotations ?", { title: "Confirmer", kind: "warning" });
    if (ok) onChange(defaultState());
  }

  async function exportImage() {
    if (!displaySrc || exporting) return;
    setExporting(true);
    try {
      if (await exportDataUrl(displaySrc)) notify({ title: "Image exportée", kind: "success", durationMs: 3000 });
    } catch (err) {
      notify({ title: "Échec de l'export", body: String(err) });
    } finally {
      setExporting(false);
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    void handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.currentTarget.files);
          e.currentTarget.value = "";
        }}
      />

      <ImageToolbar
        hasImage={!!value.image}
        hasAnnotations={hasAnnotations}
        exporting={exporting}
        onPick={pick}
        onCapture={(dataUrl) => void handleCapture(dataUrl)}
        onCaptureError={(err) =>
          notify({ title: "Capture impossible", body: String(err), kind: "alarm", durationMs: 8000 })
        }
        onAnnotate={() => setEditing(true)}
        onExport={() => void exportImage()}
        onClearAnnotations={() => void clearAnnotations()}
        onRemove={() => void removeImage()}
      />

      <div
        className={cn(
          "relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl transition-shadow",
          displaySrc && "bg-surface-secondary p-3",
          dragOver && "ring-2 ring-accent/50",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        {displaySrc ? (
          <img
            src={displaySrc}
            alt="Image annotée"
            title="Double-cliquer pour annoter"
            draggable={false}
            onDoubleClick={() => setEditing(true)}
            className="max-h-full max-w-full cursor-pointer rounded-[10px] object-contain shadow-[0_1px_2px_rgba(16,24,40,.08),0_4px_14px_rgba(16,24,40,.08)]"
          />
        ) : (
          <ImageDropZone onPick={pick} />
        )}
      </div>

      {value.image && (
        <AnnotateModal
          isOpen={editing}
          image={value.image}
          markerState={value.markerState}
          onSave={saveAnnotations}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}
