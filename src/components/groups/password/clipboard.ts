import { invoke } from "@tauri-apps/api/core";
import { notify } from "@/lib/notify";

/**
 * Copie `text` dans le presse-papier et confirme par une notification. La copie est marquée
 * sensible : exclue de l'historique Windows (Win+V), du cloud et de l'historique de yuri2.
 */
export async function copyWithNotice(label: string, text: string): Promise<void> {
  if (!text) {
    notify({ title: "Rien à copier", body: `${label} vide pour cette entrée.`, durationMs: 3000 });
    return;
  }
  try {
    await invoke("clipboard_write_text", { text, sensitive: true });
    notify({ title: `${label} copié`, body: "Disponible dans le presse-papier.", kind: "success", durationMs: 3000 });
  } catch {
    notify({ title: "Échec de la copie", body: "L'accès au presse-papier a été refusé.", durationMs: 3000 });
  }
}
