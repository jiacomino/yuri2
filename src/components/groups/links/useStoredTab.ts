import { useState } from "react";

/**
 * Onglet actif mémorisé dans localStorage (pur état d'interface, hors base) : en
 * revenant sur l'espace de travail, on retrouve l'onglet quitté.
 */
export function useStoredTab(storageKey: string, tabs: { id: string }[]): [string, (id: string) => void] {
  const [stored, setStored] = useState<string>(() => {
    try {
      return localStorage.getItem(storageKey) ?? "";
    } catch {
      return "";
    }
  });

  const activeId = tabs.some((t) => t.id === stored) ? stored : (tabs[0]?.id ?? "");

  function setActive(id: string) {
    setStored(id);
    try {
      if (id) localStorage.setItem(storageKey, id);
      else localStorage.removeItem(storageKey);
    } catch {
      /* stockage indisponible : on garde l'état en mémoire */
    }
  }

  return [activeId, setActive];
}
