import { invoke } from "@tauri-apps/api/core";
import { confirm, open, save } from "@tauri-apps/plugin-dialog";

const FILTERS = [{ name: "Sauvegarde yuri2", extensions: ["json"] }];

function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

/** Sauvegarde complète (espaces + composants) dans un fichier JSON. Null si annulé. */
export async function exportBackup(): Promise<string | null> {
  const path = await save({ title: "Exporter yuri2", defaultPath: `yuri2-sauvegarde-${today()}.json`, filters: FILTERS });
  if (!path) return null;
  await invoke("export_data", { path });
  return path;
}

/**
 * Restaure une sauvegarde après confirmation : remplace TOUTES les données actuelles.
 * Null si annulé ; l'appelant recharge l'application.
 */
export async function importBackup(): Promise<{ workspaces: number; groups: number } | null> {
  const path = await open({ title: "Importer une sauvegarde yuri2", filters: FILTERS });
  if (typeof path !== "string") return null;
  const ok = await confirm(
    "L'import va ÉCRASER tous vos espaces et composants actuels par le contenu du fichier. Continuer ?",
    { title: "Confirmer l'import", kind: "warning", okLabel: "Remplacer", cancelLabel: "Annuler" },
  );
  if (!ok) return null;
  return invoke<{ workspaces: number; groups: number }>("import_data", { path });
}
