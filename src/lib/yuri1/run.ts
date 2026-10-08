import { confirm, message, open } from "@tauri-apps/plugin-dialog";
import { importYuri1, readYuri1 } from "./import";
import type { V1Data } from "./types";

const TITLE = "Importer depuis yuri 1";

/** Base yuri 1 à l'emplacement habituel, sinon choisie par l'utilisateur. */
async function locate(): Promise<V1Data | null> {
  try {
    return await readYuri1();
  } catch {
    const picked = await open({
      title: "Base yuri 1 introuvable : choisir yuri.db",
      filters: [{ name: "Base yuri", extensions: ["db"] }],
    });
    return typeof picked === "string" ? readYuri1(picked) : null;
  }
}

/** Parcours complet : lecture, confirmation, import, compte rendu puis rechargement. */
export async function runYuri1Import(): Promise<void> {
  try {
    const data = await locate();
    if (!data) return;
    const ok = await confirm(
      `${data.workspaces.length} espace(s) et ${data.groups.length} composant(s) trouvés dans\n${data.path}\n\n` +
        "Ils seront ajoutés à côté de vos données yuri2, qui ne sont pas modifiées. " +
        "Un second import créerait des doublons.",
      { title: TITLE, kind: "info", okLabel: "Importer", cancelLabel: "Annuler" },
    );
    if (!ok) return;

    const report = await importYuri1(data);
    const lines = [`${report.workspaces} espace(s) et ${report.groups} composant(s) importés.`];
    if (report.reset.length) lines.push(`\nContenu non repris (composant vide) :\n• ${report.reset.join("\n• ")}`);
    if (report.skipped.length) lines.push(`\nIgnorés (type inconnu) :\n• ${report.skipped.join("\n• ")}`);
    await message(lines.join("\n"), { title: TITLE, kind: "info" });
    window.location.reload();
  } catch (err) {
    await message(`L'import a échoué : ${String(err)}`, { title: TITLE, kind: "error" });
  }
}
