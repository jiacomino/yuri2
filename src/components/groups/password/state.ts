/**
 * État du groupe « Mots de passe ». Même forme que yuri (stockage en clair) ;
 * le chiffrement côté Rust est prévu ultérieurement.
 */
export type PasswordEntry = {
  id: string;
  name: string;
  username: string;
  password: string;
  url?: string;
};

export type PasswordTab = {
  id: string;
  name: string;
  entries: PasswordEntry[];
};

export type PasswordState = {
  tabs: PasswordTab[];
  activeTabId: string;
};

export type EntryDraft = Omit<PasswordEntry, "id">;

export function newId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export function defaultState(): PasswordState {
  const id = newId();
  return { tabs: [{ id, name: "Comptes", entries: [] }], activeTabId: id };
}

export function demoState(): PasswordState {
  const perso: PasswordTab = {
    id: "perso",
    name: "Perso",
    entries: [
      {
        id: "p1",
        name: "Forum cuisine",
        username: "marie.dupont@example.fr",
        password: "Tarte-Tatin-1987",
        url: "https://forum.marmiton.org",
      },
      { id: "p2", name: "Médiathèque", username: "0456 7821", password: "lecture42", url: "https://mediatheque.example.fr" },
      { id: "p3", name: "Box Internet", username: "admin", password: "k8#Pz!w2Qm" },
    ],
  };
  const travail: PasswordTab = {
    id: "travail",
    name: "Travail",
    entries: [
      {
        id: "t1",
        name: "Intranet RH",
        username: "m.dupont",
        password: "Printemps2026!",
        url: "https://intranet.example.com",
      },
      { id: "t2", name: "Wiki équipe", username: "marie", password: "wiki-7731", url: "https://wiki.example.com" },
    ],
  };
  return { tabs: [perso, travail, { id: "jeux", name: "Jeux", entries: [] }], activeTabId: "perso" };
}
