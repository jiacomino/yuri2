import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { Renderer, type AnnotationState } from "@markerjs/markerjs3";

/** Au-delà de cette dimension, l'image est réduite pour garder des data URL raisonnables. */
const MAX_IMAGE_DIM = 1600;

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image illisible."));
    img.src = src;
  });
}

/** Lit un fichier image en data URL, réduit si plus grand que MAX_IMAGE_DIM. */
export async function fileToDataUrl(file: File): Promise<string> {
  const src = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
  let img: HTMLImageElement;
  try {
    img = await loadImage(src);
  } catch {
    return src;
  }
  const max = Math.max(img.naturalWidth, img.naturalHeight);
  if (max <= MAX_IMAGE_DIM) return src;
  const scale = MAX_IMAGE_DIM / max;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return src;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

/** Aplatit image + annotations en PNG (taille naturelle de l'image). */
export async function renderAnnotated(image: string, state: AnnotationState): Promise<string> {
  const renderer = new Renderer();
  renderer.targetImage = await loadImage(image);
  renderer.naturalSize = true;
  renderer.imageType = "image/png";
  return renderer.rasterize(state);
}

/**
 * Demande un chemin puis écrit l'image via la commande Rust `save_binary_file`.
 * Renvoie `false` si l'utilisateur a annulé.
 */
export async function exportDataUrl(src: string): Promise<boolean> {
  const mime = src.slice(5, src.indexOf(";"));
  const ext = mime === "image/jpeg" ? "jpg" : "png";
  const path = await save({
    title: "Exporter l'image annotée",
    defaultPath: `image-annotee.${ext}`,
    filters: [{ name: "Image", extensions: [ext] }],
  });
  if (!path) return false;
  const buf = await (await fetch(src)).arrayBuffer();
  await invoke("save_binary_file", { path, data: Array.from(new Uint8Array(buf)) });
  return true;
}
