import { genId } from "@/lib/id";

export type LinkItem = {
  id: string;
  /** « link » : lien cliquable ; « separator » : intertitre visuel sans URL. */
  kind: "link" | "separator";
  /** Nom du lien ou libellé du séparateur. */
  name: string;
  /** Vide pour un séparateur. */
  url: string;
  /** Identifiant associé au lien (optionnel). */
  username?: string;
  /** Mot de passe associé au lien (optionnel, stocké en clair comme le groupe « Mots de passe »). */
  password?: string;
};

export type LinkTab = {
  id: string;
  name: string;
  items: LinkItem[];
};

export type LinksState = {
  tabs: LinkTab[];
};

export function defaultState(): LinksState {
  return { tabs: [{ id: genId(), name: "Liens", items: [] }] };
}

const link = (name: string, url: string): LinkItem => ({ id: genId(), kind: "link", name, url });
const separator = (name: string): LinkItem => ({ id: genId(), kind: "separator", name, url: "" });

export function demoState(): LinksState {
  return {
    tabs: [
      {
        id: genId(),
        name: "Travail",
        items: [
          separator("Au quotidien"),
          link("Gmail", "https://mail.google.com/"),
          link("Google Agenda", "https://calendar.google.com/"),
          link("Notion — Wiki équipe", "https://www.notion.so/"),
          link("Slack", "https://app.slack.com/"),
          separator("Développement"),
          link("GitHub", "https://github.com/"),
          link("MDN Web Docs", "https://developer.mozilla.org/fr/"),
          link("Documentation Tauri", "https://v2.tauri.app/fr/"),
        ],
      },
      {
        id: genId(),
        name: "Veille",
        items: [
          link("Le Monde — Pixels", "https://www.lemonde.fr/pixels/"),
          link("Next INpact", "https://next.ink/"),
          link("Hacker News", "https://news.ycombinator.com/"),
          link("Product Hunt", "https://www.producthunt.com/"),
        ],
      },
      {
        id: genId(),
        name: "Perso",
        items: [
          link("Doctolib", "https://www.doctolib.fr/"),
          link("Ameli", "https://www.ameli.fr/"),
          link("SNCF Connect", "https://www.sncf-connect.com/"),
          link("Impots.gouv", "https://www.impots.gouv.fr/"),
        ],
      },
    ],
  };
}
