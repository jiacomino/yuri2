import { confirm } from "@tauri-apps/plugin-dialog";

/**
 * Demande de confirmation avant une suppression. Utilise la boîte de dialogue native
 * Tauri ; repli sur `window.confirm` hors Tauri (aperçu navigateur).
 */
export async function confirmDelete(message: string): Promise<boolean> {
  try {
    return await confirm(message, { title: "Confirmer la suppression", kind: "warning" });
  } catch {
    return window.confirm(message);
  }
}
