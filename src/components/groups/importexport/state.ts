import { newConnector, normalizeConnector, type IeConnector } from "@/lib/importExport";

/**
 * État du groupe « Import / Export » : ses connecteurs (un onglet chacun). Les mots de
 * passe (`password`) sont chiffrés en base par le backend et arrivent ici en clair.
 * Les paramètres partagés (outils, applications, environnements, serveurs) sont dans
 * Paramètres › Import / Export ; l'historique des exécutions est en base (`ie_runs`).
 */
export type ImportExportState = {
  connectors: IeConnector[];
  activeId: string | null;
};

export function defaultState(): ImportExportState {
  return { connectors: [], activeId: null };
}

export function demoState(): ImportExportState {
  const c = newConnector({ name: "Base principale", databases: ["boutique", "crm"], host: "db.local", user: "backup" });
  return { connectors: [c, newConnector({ name: "Recette", databases: ["boutique"] })], activeId: c.id };
}

/** Connecteurs complétés (champs ajoutés depuis leur création). */
export function connectorsOf(state: ImportExportState): IeConnector[] {
  return (state.connectors ?? []).map(normalizeConnector);
}
