import { genId } from "@/lib/id";

export type MarkdownViewMode = "edit" | "split" | "preview";

export type MarkdownTab = {
  id: string;
  name: string;
  /** Texte Markdown brut. */
  text: string;
};

export type MarkdownState = {
  tabs: MarkdownTab[];
  activeTabId: string;
  /** Partagé entre onglets : on reste dans la même vue en changeant d'onglet. */
  mode: MarkdownViewMode;
};

export function defaultState(): MarkdownState {
  const id = genId();
  return { tabs: [{ id, name: "Note", text: "" }], activeTabId: id, mode: "edit" };
}

const REUNION = `# Réunion produit — 14 octobre

**Participants** : Claire, Mehdi, Sophie, Thomas

## Décisions
- Lancement de la **v2.3** repoussé au *28 octobre*
- Le module d'export PDF passe en priorité haute
- ~~Refonte de l'onboarding~~ → reportée au T1

## Actions
- [x] Envoyer le compte rendu à l'équipe
- [ ] Mettre à jour la [feuille de route](https://www.notion.so/)
- [ ] Préparer la démo client (Sophie)

| Sujet | Responsable | Échéance |
| --- | --- | --- |
| Export PDF | Mehdi | 21/10 |
| Tests de charge | Thomas | 24/10 |

> « Mieux vaut livrer moins, mais mieux. » — Claire
`;

const MEMO = `# Mémo Git

\`\`\`bash
git switch -c feature/export-pdf
git commit -m "feat: export PDF"
git push -u origin HEAD
\`\`\`

1. Toujours partir de \`main\` à jour
2. Une branche par fonctionnalité
3. Relecture avant fusion
`;

export function demoState(): MarkdownState {
  const first = genId();
  return {
    tabs: [
      { id: first, name: "Réunion", text: REUNION },
      { id: genId(), name: "Mémo Git", text: MEMO },
    ],
    activeTabId: first,
    mode: "preview",
  };
}
